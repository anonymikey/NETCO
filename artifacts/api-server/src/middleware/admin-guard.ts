import { FastifyRequest, FastifyReply } from "fastify";
import { trackFailedAdminAttempt } from "../services/security-logger";

/**
 * Middleware to protect admin endpoints
 * Logs all unauthorized access attempts with IP and user agent
 * Alerts after 3+ failed attempts within 5 minutes
 */
export async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  // Check for admin authentication (you can add your auth logic here)
  const adminToken = request.headers["x-admin-token"] || request.query?.admin_token;
  const validToken = process.env.ADMIN_TOKEN;

  if (!validToken || adminToken !== validToken) {
    const ip = request.ip || request.headers["x-forwarded-for"] || "unknown";
    const userAgent = request.headers["user-agent"];

    // Track and log the failed attempt
    const isThresholdExceeded = trackFailedAdminAttempt(
      ip as string,
      request.url,
      userAgent as string
    );

    reply.code(403).send({
      error: "Unauthorized access to admin panel",
      message: isThresholdExceeded
        ? "Multiple failed access attempts detected. System administrator has been notified."
        : "Invalid or missing admin credentials",
    });
  }
}
