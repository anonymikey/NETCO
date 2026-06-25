/**
 * Credential Validation Utility
 * Validates Device ID (HTTP Injector) and HWID (HTTP Custom) formats
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * HTTP Custom: HWID Format
 * Requirements:
 * - Exactly 32 lowercase hexadecimal characters
 * - Pattern: ^[a-f0-9]{32}$
 * Example: 0979c85da5eef2f998334156cb53edf6
 */
export function validateHTTPCustomHWID(hwid: string): ValidationResult {
  if (!hwid) {
    return { isValid: false, error: "HWID is required" };
  }

  const pattern = /^[a-f0-9]{32}$/;
  if (!pattern.test(hwid)) {
    return {
      isValid: false,
      error: "Invalid HWID format. Must be exactly 32 lowercase hexadecimal characters (0-9, a-f)",
    };
  }

  return { isValid: true };
}

/**
 * HTTP Injector: Device ID Format
 * Requirements:
 * - Exactly 32 uppercase alphanumeric characters
 * - Pattern: ^[A-Z0-9]{32}$
 * Example: C4E61860CA87C6CB24C9C56BE3312E6
 */
export function validateHTTPInjectorDeviceID(deviceId: string): ValidationResult {
  if (!deviceId) {
    return { isValid: false, error: "Device ID is required" };
  }

  const pattern = /^[A-Z0-9]{32}$/;
  if (!pattern.test(deviceId)) {
    return {
      isValid: false,
      error: "Invalid Device ID format. Must be exactly 32 uppercase alphanumeric characters (A-Z, 0-9)",
    };
  }

  return { isValid: true };
}

/**
 * Generic credential validation based on app type
 */
export function validateCredential(
  credential: string,
  appType: "http_custom" | "http_injector"
): ValidationResult {
  if (appType === "http_custom") {
    return validateHTTPCustomHWID(credential);
  } else {
    return validateHTTPInjectorDeviceID(credential);
  }
}

/**
 * Get credential field label based on app type
 */
export function getCredentialLabel(appType: "http_custom" | "http_injector"): string {
  return appType === "http_custom" ? "HWID" : "Device ID";
}

/**
 * Get credential format description based on app type
 */
export function getCredentialFormat(appType: "http_custom" | "http_injector"): string {
  if (appType === "http_custom") {
    return "32 lowercase hexadecimal characters (0-9, a-f)";
  } else {
    return "32 uppercase alphanumeric characters (A-Z, 0-9)";
  }
}
