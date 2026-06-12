import { FastifyInstance } from "fastify";

interface SecurityAlert {
  timestamp: string;
  type: "unauthorized_access_attempt" | "multiple_failed_attempts" | "suspicious_pattern";
  endpoint: string;
  ip: string;
  userAgent?: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
}

const failedAttempts: Record<string, { count: number; firstAttempt: number; ips: Set<string> }> = {};
const ALERT_THRESHOLD = 3; // Alert after 3 failed attempts
const TIME_WINDOW = 5 * 60 * 1000; // 5 minutes

export function logSecurityAlert(alert: SecurityAlert) {
  const timestamp = new Date().toISOString();
  const alertWithTime = { ...alert, timestamp };
  
  // Log to console with severity color
  const severityEmoji = {
    low: "🟡",
    medium: "🟠",
    high: "🔴",
    critical: "⛔",
  }[alert.severity];

  console.error(`${severityEmoji} [SECURITY] ${alertWithTime.type.toUpperCase()}`);
  console.error(`   Time: ${timestamp}`);
  console.error(`   Endpoint: ${alert.endpoint}`);
  console.error(`   IP: ${alert.ip}`);
  console.error(`   Severity: ${alert.severity}`);
  console.error(`   Details: ${alert.details}`);

  // TODO: In production, send this to a monitoring service (Sentry, DataDog, etc.)
  // alertingService.send(alertWithTime);
}

export function trackFailedAdminAttempt(ip: string, endpoint: string, userAgent?: string) {
  const now = Date.now();
  
  if (!failedAttempts[ip]) {
    failedAttempts[ip] = { count: 1, firstAttempt: now, ips: new Set([ip]) };
  } else {
    // Reset if outside time window
    if (now - failedAttempts[ip].firstAttempt > TIME_WINDOW) {
      failedAttempts[ip] = { count: 1, firstAttempt: now, ips: new Set([ip]) };
    } else {
      failedAttempts[ip].count++;
      failedAttempts[ip].ips.add(ip);
    }
  }

  const attempts = failedAttempts[ip];

  // Log the attempt
  logSecurityAlert({
    type: "unauthorized_access_attempt",
    endpoint,
    ip,
    userAgent,
    details: `Failed admin panel access attempt (${attempts.count}/${ALERT_THRESHOLD})`,
    severity: attempts.count >= ALERT_THRESHOLD ? "critical" : "high",
  });

  // Alert if threshold reached
  if (attempts.count >= ALERT_THRESHOLD) {
    logSecurityAlert({
      type: "multiple_failed_attempts",
      endpoint: "/admin",
      ip,
      userAgent,
      details: `MULTIPLE FAILED ATTEMPTS from IP ${ip}: ${attempts.count} attempts in ${Math.round((now - attempts.firstAttempt) / 1000)}s. IMMEDIATE ACTION RECOMMENDED.`,
      severity: "critical",
    });
  }

  return attempts.count >= ALERT_THRESHOLD;
}

export function cleanupOldAttempts() {
  const now = Date.now();
  for (const [ip, data] of Object.entries(failedAttempts)) {
    if (now - data.firstAttempt > TIME_WINDOW) {
      delete failedAttempts[ip];
    }
  }
}

// Cleanup every minute
setInterval(cleanupOldAttempts, 60 * 1000);
