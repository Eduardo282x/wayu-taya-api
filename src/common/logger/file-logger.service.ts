import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  ip?: string;
  userAgent?: string;
  message: string;
  requestBody?: any;
  responseSize?: number;
}

@Injectable()
export class FileLoggerService {
  private readonly logsDir: string;
  private combinedFile: string;
  private errorFile: string;
  private currentDate: string = '';

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.ensureLogsDir();
    this.currentDate = this.getDateString();
    this.combinedFile = path.join(
      this.logsDir,
      `combined-${this.currentDate}.log`,
    );
    this.errorFile = path.join(this.logsDir, `error-${this.currentDate}.log`);
    this.writeHeader(this.combinedFile, 'LOG COMBINADO');
    this.writeHeader(this.errorFile, 'LOG DE ERRORES');
  }

  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getTimestamp(): string {
    const now = new Date();
    const date = this.getDateString();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${date} ${hours}:${minutes}:${seconds}`;
  }

  private ensureLogsDir(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private writeHeader(filePath: string, title: string): void {
    if (!fs.existsSync(filePath)) {
      const separator = '='.repeat(80);
      const header = [
        separator,
        `  ${title}`,
        `  Fecha: ${this.getDateString()}`,
        separator,
        '',
      ].join('\n');
      fs.appendFileSync(filePath, header, 'utf-8');
    }
  }

  private rotateIfNeeded(): void {
    const today = this.getDateString();
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.combinedFile = path.join(
        this.logsDir,
        `combined-${this.currentDate}.log`,
      );
      this.errorFile = path.join(this.logsDir, `error-${this.currentDate}.log`);
      this.writeHeader(this.combinedFile, 'LOG COMBINADO');
      this.writeHeader(this.errorFile, 'LOG DE ERRORES');
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = this.getTimestamp();
    const method = (entry.method || 'N/A').padEnd(7);
    const url = (entry.url || 'N/A').padEnd(40);
    const status = entry.statusCode
      ? String(entry.statusCode).padEnd(5)
      : 'N/A  ';
    const time = entry.responseTime
      ? `${entry.responseTime}ms`.padStart(7)
      : '    N/A';
    const ip = entry.ip || 'N/A';

    let line = `[${timestamp}] ${entry.level.padEnd(5)} | ${method} | ${url} | ${status} | ${time} | ${ip}`;

    if (entry.message) {
      line += ` | ${entry.message}`;
    }

    if (entry.userAgent) {
      line += `\n                    User-Agent: ${entry.userAgent}`;
    }

    if (entry.requestBody && Object.keys(entry.requestBody).length > 0) {
      const sanitized = this.sanitizeBody(entry.requestBody);
      line += `\n                    Body: ${JSON.stringify(sanitized)}`;
    }

    if (entry.responseSize) {
      line += `\n                    Response Size: ${entry.responseSize} bytes`;
    }

    return line + '\n';
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'authorization',
      'apiKey',
      'api_key',
      'access_token',
      'refresh_token',
    ];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private writeToFile(filePath: string, content: string): void {
    try {
      this.rotateIfNeeded();
      fs.appendFileSync(filePath, content, 'utf-8');
    } catch (error) {
      console.error(`Error writing to log file ${filePath}:`, error);
    }
  }

  log(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);
    this.writeToFile(this.combinedFile, formatted);
    console.log(formatted.trim());
  }

  error(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);
    this.writeToFile(this.combinedFile, formatted);
    this.writeToFile(this.errorFile, formatted);
    console.error(formatted.trim());
  }

  warn(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);
    this.writeToFile(this.combinedFile, formatted);
    console.warn(formatted.trim());
  }

  info(entry: LogEntry): void {
    this.log(entry);
  }

  debug(entry: LogEntry): void {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatLogEntry(entry);
      this.writeToFile(this.combinedFile, formatted);
      console.debug(formatted.trim());
    }
  }
}
