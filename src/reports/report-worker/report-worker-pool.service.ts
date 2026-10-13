import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { join } from 'path';
import { Worker } from 'worker_threads';

export interface ReportTask {
  kind: string;
  payload: unknown;
}

interface QueuedTask {
  task: ReportTask;
  resolve: (buffer: Buffer) => void;
  reject: (error: Error) => void;
}

interface WorkerSlot {
  worker: Worker;
  busy: boolean;
  current?: QueuedTask;
}

/**
 * Pool de `worker_threads` con semáforo de concurrencia para generar reportes
 * sin bloquear el event loop del proceso principal.
 *
 * Decisión de la entrega: opción pragmática SIN cola persistente, SIN Redis y
 * SIN infraestructura nueva. La concurrencia se limita con un pool de N workers
 * (env `REPORT_WORKER_CONCURRENCY`, por defecto 2).
 */
@Injectable()
export class ReportWorkerPool implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportWorkerPool.name);
  private readonly maxConcurrency: number;
  private readonly queue: QueuedTask[] = [];
  private slots: WorkerSlot[] = [];
  private active = 0;
  private seq = 0;
  private shuttingDown = false;

  constructor() {
    const parsed = Number.parseInt(
      process.env.REPORT_WORKER_CONCURRENCY ?? '2',
      10,
    );
    this.maxConcurrency = Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
  }

  onModuleInit(): void {
    this.slots = Array.from({ length: this.maxConcurrency }, () =>
      this.spawnSlot(),
    );
  }

  onModuleDestroy(): void {
    this.shuttingDown = true;
    for (const slot of this.slots) {
      void slot.worker.terminate();
    }
    this.slots = [];
  }

  run(task: ReportTask): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processQueue();
    });
  }

  private spawnSlot(): WorkerSlot {
    const workerPath = join(__dirname, 'report.worker.js');
    const worker = new Worker(workerPath);
    const slot: WorkerSlot = { worker, busy: false };

    worker.on('error', (error) => {
      this.logger.error(
        `Worker de reportes falló: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.failCurrent(slot, error);
    });

    worker.on('exit', (code) => {
      if (slot.current) {
        this.failCurrent(
          slot,
          new Error(
            `Worker de reportes terminó inesperadamente (code ${code})`,
          ),
        );
      }
      if (this.shuttingDown) return;
      // Reemplaza el worker caído para no reducir el pool.
      const index = this.slots.indexOf(slot);
      if (index >= 0) this.slots[index] = this.spawnSlot();
    });

    return slot;
  }

  private failCurrent(slot: WorkerSlot, error: unknown): void {
    const item = slot.current;
    if (item) {
      slot.current = undefined;
      this.active = Math.max(0, this.active - 1);
      item.reject(error instanceof Error ? error : new Error(String(error)));
    }
    slot.busy = false;
    this.processQueue();
  }

  private processQueue(): void {
    while (this.active < this.maxConcurrency && this.queue.length > 0) {
      const slot = this.slots.find((candidate) => !candidate.busy);
      if (!slot) break;

      const item = this.queue.shift();
      if (!item) break;

      slot.busy = true;
      slot.current = item;
      this.active += 1;

      const id = ++this.seq;
      const onMessage = (msg: {
        id: number;
        ok: boolean;
        buffer?: Uint8Array;
        error?: { message?: string; stack?: string };
      }): void => {
        if (msg.id !== id) return;
        slot.worker.off('message', onMessage);
        slot.busy = false;
        slot.current = undefined;
        this.active = Math.max(0, this.active - 1);

        if (msg.ok && msg.buffer) {
          item.resolve(Buffer.from(msg.buffer));
        } else {
          const error = new Error(
            msg.error?.message ?? 'Error desconocido en el worker de reportes',
          );
          if (msg.error?.stack) error.stack = msg.error.stack;
          item.reject(error);
        }
        this.processQueue();
      };

      slot.worker.on('message', onMessage);
      slot.worker.postMessage({
        id,
        kind: item.task.kind,
        payload: item.task.payload,
      });
    }
  }
}
