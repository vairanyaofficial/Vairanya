// lib/logger.ts
// Production-safe logging utility

type LogLevel = "log" | "info" | "warn" | "error";

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    // In production, only log errors and warnings
    if (this.isProduction && (level === "log" || level === "info")) {
      return;
    }

    // Format the message
    switch (level) {
      case "error":
        console.error(prefix, message, ...args);
        break;
      case "warn":
        console.warn(prefix, message, ...args);
        break;
      case "info":
        console.info(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    this.formatMessage("log", message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage("info", message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage("warn", message, ...args);
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (error instanceof Error) {
      this.formatMessage("error", message, {
        error: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        ...args,
      });
    } else {
      this.formatMessage("error", message, error, ...args);
    }
  }
}

export const logger = new Logger();
