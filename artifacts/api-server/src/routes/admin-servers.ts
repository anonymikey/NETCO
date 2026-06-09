import { Router } from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { db, configServersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { uploadConfigFile, downloadConfigFile, deleteConfigFile, getSupabaseAdmin } from "../lib/storage";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".ehi" || ext === ".hc") {
      cb(null, true);
    } else {
      cb(new Error("Only .ehi and .hc config files are allowed"));
    }
  },
});

router.get("/servers", async (req, res) => {
  const servers = await db
    .select()
    .from(configServersTable)
    .orderBy(configServersTable.createdAt);
  res.json(servers);
});

// New endpoint: Accept file and metadata, upload to Supabase using service role (bypasses RLS)
router.post("/servers/metadata", async (req, res) => {
  try {
    const { serverName, network, appType, planType, duration, originalName, fileSize, fileBuffer } = req.body as Record<string, unknown>;

    if (!serverName || !network || !appType || !planType || !duration || !originalName || !fileBuffer) {
      return res.status(400).json({ error: "All fields required: serverName, network, appType, planType, duration, originalName, fileBuffer (base64)" });
    }

    // Decode the base64 file buffer sent from frontend
    const buffer = Buffer.from(fileBuffer as string, 'base64');
    
    // Upload to Supabase using service role (bypasses RLS policies)
    const fileName = `${network}_${appType}_${Date.now()}_${originalName}`;
    
    const { data: uploadData, error: uploadError } = await getSupabaseAdmin()
      .storage
      .from("vpn-configs")
      .upload(fileName, buffer, {
        contentType: "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = getSupabaseAdmin()
      .storage
      .from("vpn-configs")
      .getPublicUrl(fileName);

    const fileUrl = publicUrlData.publicUrl;

    // Save server metadata to database
    const id = randomUUID();
    const now = new Date();

    const result = await db
      .insert(configServersTable)
      .values({
        id,
        name: String(serverName),
        serverName: String(serverName),
        network: String(network),
        appType: String(appType),
        planType: String(planType),
        duration: String(duration),
        filename: fileName,
        originalName: String(originalName),
        fileSize: Number(fileSize) || 0,
        fileUrl,
        status: "active",
        isFree: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const server = result[0];

    if (!server) {
      return res.status(500).json({ error: "Failed to create server record" });
    }

    req.log.info({ id, serverName, network, appType }, "Config server added via metadata endpoint");
    return res.status(201).json(server);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add config server";
    req.log.error({ err }, "Error adding config server via metadata");
    return res.status(500).json({ error: message });
  }
});

router.post("/servers", upload.single("configFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Config file (.ehi or .hc) is required" });
    }

    const { serverName, network, appType, planType, duration } = req.body as Record<string, string>;

    if (!serverName || !network || !appType || !planType || !duration) {
      return res.status(400).json({ error: "All fields are required: serverName, network, appType, planType, duration" });
    }

    const stored = await uploadConfigFile(req.file.buffer, req.file.originalname);

    const id = randomUUID();
    const now = new Date();

    const result = await db
      .insert(configServersTable)
      .values({
        id,
        name: serverName,
        serverName,
        network,
        appType,
        planType,
        duration,
        filename: stored.filename,
        originalName: stored.originalName,
        fileSize: stored.fileSize,
        fileUrl: stored.fileUrl,
        status: "active",
        isFree: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const server = result[0];

    if (!server) {
      return res.status(500).json({ error: "Failed to create server record" });
    }

    req.log.info({ id, serverName, network, appType }, "Config server added");
    return res.status(201).json(server);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add config server";
    req.log.error({ err }, "Error adding config server");
    return res.status(500).json({ error: message });
  }
});

router.patch("/servers/:id", async (req, res) => {
  const id = req.params["id"] as string;
  const { status, isFree } = req.body as { status?: string; isFree?: boolean };

  if (status !== undefined && !["active", "inactive"].includes(status)) {
    res.status(400).json({ error: "status must be 'active' or 'inactive'" });
    return;
  }

  const updateFields: Record<string, unknown> = {};
  if (status !== undefined) updateFields.status = status;
  if (isFree !== undefined) updateFields.isFree = Boolean(isFree);

  if (Object.keys(updateFields).length === 0) {
    res.status(400).json({ error: "Provide at least one field to update: status or isFree" });
    return;
  }

  const [updated] = await db
    .update(configServersTable)
    .set(updateFields)
    .where(eq(configServersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Config server not found" });
    return;
  }

  // Log server status changes for real-time updates
  req.log.info({ 
    id, 
    serverName: updated.serverName, 
    status: updated.status,
    isFree: updated.isFree, 
  }, "Server status updated - real-time sync triggered");

  res.json(updated);
});

router.put("/servers/:id/file", upload.single("configFile"), async (req, res) => {
  try {
    const id = req.params["id"] as string;

    if (!req.file) {
      res.status(400).json({ error: "Config file (.ehi or .hc) is required" });
      return;
    }

    const [existing] = await db
      .select()
      .from(configServersTable)
      .where(eq(configServersTable.id, id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Config server not found" });
      return;
    }

    await deleteConfigFile(existing.filename).catch(() => {});

    const stored = await uploadConfigFile(req.file.buffer, req.file.originalname);

    const [updated] = await db
      .update(configServersTable)
      .set({
        filename: stored.filename,
        originalName: stored.originalName,
        fileSize: stored.fileSize,
        fileUrl: stored.fileUrl,
      })
      .where(eq(configServersTable.id, id))
      .returning();

    req.log.info({ id, newFile: stored.filename }, "Config file replaced");
    res.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to replace config file";
    req.log.error({ err }, "Error replacing config file");
    res.status(500).json({ error: message });
  }
});

router.delete("/servers/:id", async (req, res) => {
  const id = req.params["id"] as string;

  const [existing] = await db
    .select()
    .from(configServersTable)
    .where(eq(configServersTable.id, id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Config server not found" });
    return;
  }

  await deleteConfigFile(existing.filename).catch(() => {});
  await db.delete(configServersTable).where(eq(configServersTable.id, id));

  req.log.info({ id }, "Config server deleted");
  res.json({ success: true });
});

router.get("/servers/:id/download", async (req, res) => {
  const id = req.params["id"] as string;

  const [server] = await db
    .select()
    .from(configServersTable)
    .where(eq(configServersTable.id, id))
    .limit(1);

  if (!server) {
    res.status(404).json({ error: "Config server not found" });
    return;
  }

  const buffer = await downloadConfigFile(server.filename);

  res.setHeader("Content-Disposition", `attachment; filename="${server.originalName}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", buffer.byteLength);
  res.send(buffer);
});

export default router;
