import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.resolve(__dirname, '../../logs');
const logFile = path.join(logDir, 'audit.log');


// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Writes an audit log entry with timestamp and event details.
 * @param eventType - Type of event (e.g., 'ADMIN_PROMOTION', 'LOGIN_SUCCESS')
 * @param message - Descriptive message of the event
 * @param metadata - Optional additional data (user id, email, IP, etc.)
 */
export function auditLog(eventType: string, message: string, metadata?: Record<string, any>) {
  const logEntry = {
    timestamp: getTimestamp(),
    eventType,
    message,
    metadata: metadata || {},
  };
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Failed to write audit log:', err);
    }
  });
}
