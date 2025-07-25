/**
 * Logger utility for API
 * 
 * Provides structured logging with different levels
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
}

export class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const prefix = `[${timestamp}] ${level}`;
    
    let message = `${prefix} ${entry.message}`;
    
    if (entry.context) {
      message += ` ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      message += `\n${entry.error.stack || entry.error.message}`;
    }
    
    return message;
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      error
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    // In production, you might want to send logs to an external service
    if (!this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement integration with services like:
    // - Datadog
    // - New Relic
    // - CloudWatch
    // - Sentry (for errors)
  }

  public debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, error?: Error | any, context?: any): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, context, error);
    } else {
      this.log(LogLevel.ERROR, message, { ...context, error });
    }
  }

  // Request logging middleware
  public requestLogger() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      
      // Log request
      this.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });

      // Log response
      res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
        
        this.log(level, `${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
          statusCode: res.statusCode,
          duration
        });
      });

      next();
    };
  }

  // SQL query logging
  public logQuery(sql: string, params?: any[], duration?: number): void {
    this.debug('SQL Query', {
      sql: sql.trim().replace(/\s+/g, ' '),
      params,
      duration: duration ? `${duration}ms` : undefined
    });
  }
}

export const logger = Logger.getInstance();