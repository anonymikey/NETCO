import { Router, type IRouter } from "express";
import healthRouter from "./health";
import packagesRouter from "./packages";
import ordersRouter from "./orders";
import paymentRouter from "./payment";
import plansRouter from "./plans";
import contactRouter from "./contact";
import statsRouter from "./stats";
import adminServersRouter from "./admin-servers";
import authEmailRouter from "./auth-email";
import authProfileRouter from "./auth-profile";
import adminOrdersRouter from "./admin-orders";
import adminAnnouncementsRouter from "./admin-announcements";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/packages", packagesRouter);
router.use("/orders", ordersRouter);
router.use("/payment", paymentRouter);
router.use("/plans", plansRouter);
router.use("/contact", contactRouter);
router.use(statsRouter);
router.use("/admin", adminServersRouter);
router.use("/admin", statsRouter);
router.use("/admin", adminOrdersRouter);
router.use("/admin", adminAnnouncementsRouter);
router.use("/auth/email", authEmailRouter);
router.use("/auth/profile", authProfileRouter);

// Temporary diagnostic route to debug database connection
router.get("/debug/db-url", async (req, res) => {
  const url =
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL;

  const masked = url?.replace(/:(.*?)@/, ":****@");

  res.json({
    using: process.env.POSTGRES_URL
      ? "POSTGRES_URL"
      : process.env.SUPABASE_DATABASE_URL
        ? "SUPABASE_DATABASE_URL"
        : "DATABASE_URL",
    url: masked,
  });
});

export default router;
