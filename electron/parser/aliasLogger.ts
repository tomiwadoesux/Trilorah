/**
 * Alias Miss Logger
 * Logs unrecognized book names for continuous improvement
 * Review alias_misses.log weekly to add new aliases
 */

import { appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { app } from "electron";

let logPath: string | null = null;

/**
 * Initialize the log file path
 * Call this after app.whenReady()
 */
export function initAliasLogger(): void {
  try {
    const userDataPath = app.getPath("userData");
    const logsDir = join(userDataPath, "logs");

    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }

    logPath = join(logsDir, "alias_misses.log");
    console.log("[AliasLogger] Initialized at:", logPath);
  } catch (error) {
    console.error("[AliasLogger] Failed to initialize:", error);
  }
}

/**
 * Log a missed book name for later review
 * Call when:
 * - No book detected from input
 * - Confidence is below threshold
 * - Manual override was needed
 */
export function logMiss(raw: string, context?: string): void {
  if (!logPath) {
    console.warn("[AliasLogger] Not initialized, skipping log");
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const entry = context
      ? `[${timestamp}] "${raw}" | Context: ${context}\n`
      : `[${timestamp}] "${raw}"\n`;

    appendFileSync(logPath, entry);
  } catch (error) {
    console.error("[AliasLogger] Failed to log miss:", error);
  }
}

/**
 * Get the log file path (for UI or debugging)
 */
export function getLogPath(): string | null {
  return logPath;
}
