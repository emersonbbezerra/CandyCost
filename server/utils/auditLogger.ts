import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.resolve(__dirname, '../../logs');
const logFile = path.join(logDir, 'audit.log');
const conversionLogFile = path.join(logDir, 'unit-conversions.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

interface ConversionAuditEntry {
  timestamp: string;
  ingredientId: string;
  ingredientName: string;
  oldUnit: string;
  newUnit: string;
  conversions: {
    recipeId: string;
    productName: string;
    oldQuantity: number;
    oldUnit: string;
    newQuantity: number;
    newUnit: string;
  }[];
  errors: string[];
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
export function auditLog(
  eventType: string,
  message: string,
  metadata?: Record<string, any>
) {
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

/**
 * Logs unit conversion operations with detailed information about recipe updates
 */
export function logUnitConversion(entry: ConversionAuditEntry): void {
  try {
    const logEntry = {
      timestamp: entry.timestamp,
      type: 'UNIT_CONVERSION',
      ingredientId: entry.ingredientId,
      ingredientName: entry.ingredientName,
      unitChange: `${entry.oldUnit} → ${entry.newUnit}`,
      conversionsCount: entry.conversions.length,
      errorsCount: entry.errors.length,
      details: {
        conversions: entry.conversions,
        errors: entry.errors,
      },
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFile(conversionLogFile, logLine, (err) => {
      if (err) {
        console.error('❌ [AUDIT] Failed to log unit conversion:', err);
      } else {
        console.log(
          `📝 [AUDIT] Unit conversion logged: ${entry.ingredientName} (${entry.oldUnit} → ${entry.newUnit}) - ${entry.conversions.length} conversions, ${entry.errors.length} errors`
        );
      }
    });
  } catch (error) {
    console.error('❌ [AUDIT] Failed to log unit conversion:', error);
  }
}

/**
 * Logs ingredient update operations
 */
export function logIngredientUpdate(
  ingredientId: string,
  ingredientName: string,
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[]
): void {
  try {
    const logEntry = {
      timestamp: getTimestamp(),
      type: 'INGREDIENT_UPDATE',
      ingredientId,
      ingredientName,
      changes,
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFile(conversionLogFile, logLine, (err) => {
      if (err) {
        console.error('❌ [AUDIT] Failed to log ingredient update:', err);
      } else {
        console.log(
          `📝 [AUDIT] Ingredient update logged: ${ingredientName} - ${changes.length} changes`
        );
      }
    });
  } catch (error) {
    console.error('❌ [AUDIT] Failed to log ingredient update:', error);
  }
}
