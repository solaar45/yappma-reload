/**
 * Logger Utility
 * Provides conditional logging based on environment
 * Prevents console.log statements in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]) {
    const entry: LogEntry = {
      level,
      message,
      data: args.length > 0 ? args : undefined,
      timestamp: new Date().toISOString(),
    };

    // Store in memory (circular buffer)
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return;
    }

    // Console output with formatting
    const prefix = `[${level.toUpperCase()}]`;
    const style = this.getStyle(level);

    if (this.isDevelopment) {
      console.log(`%c${prefix}`, style, message, ...args);
    } else {
      // Production: No styling
      console[level === 'debug' ? 'log' : level](prefix, message, ...args);
    }
  }

  private getStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #6c757d; font-weight: bold',
      info: 'color: #0dcaf0; font-weight: bold',
      warn: 'color: #ffc107; font-weight: bold',
      error: 'color: #dc3545; font-weight: bold',
    };
    return styles[level];
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, ...args: unknown[]) {
    this.log('debug', message, ...args);
  }

  /**
   * Info level logging (development only)
   */
  info(message: string, ...args: unknown[]) {
    this.log('info', message, ...args);
  }

  /**
   * Warning level logging (always shown)
   */
  warn(message: string, ...args: unknown[]) {
    this.log('warn', message, ...args);
  }

  /**
   * Error level logging (always shown)
   */
  error(message: string, ...args: unknown[]) {
    this.log('error', message, ...args);
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
