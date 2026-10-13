import { parentPort } from 'worker_threads';
import { ReportsService } from '../reports.service';

/**
 * Entry point del worker de reportes. Solo hace CPU (PDF/DOCX/Excel): las
 * consultas Prisma se ejecutan en el hilo principal y los datos llegan ya
 * resueltos en `payload` (serializable por structured clone).
 *
 * Importa los renderizadores estáticos de `ReportsService` (sin DI de Nest).
 */
type Renderer = (payload: any) => Promise<Buffer>;

const renderers: Record<string, Renderer> = {
  'inventory-pdf': (payload) =>
    ReportsService.renderInventoryReportPDF(payload.inventory),
  'inventory-by-store-pdf': (payload) =>
    ReportsService.renderInventoryByStorePDF(
      payload.inventory,
      payload.storeId,
    ),
  'sample-doc': (payload) => ReportsService.renderSampleDoc(payload),
  'formatted-report': (payload) =>
    ReportsService.renderFormattedReport(payload),
  'unified-report': (payload) =>
    ReportsService.renderUnifiedDonationReport(payload),
};

interface WorkerRequest {
  id: number;
  kind: string;
  payload: any;
}

if (parentPort) {
  parentPort.on('message', (request: WorkerRequest) => {
    void handle(request);
  });
}

async function handle(request: WorkerRequest): Promise<void> {
  const { id, kind, payload } = request;
  try {
    const renderer = renderers[kind];
    if (!renderer) {
      throw new Error(`Tipo de reporte desconocido: ${kind}`);
    }
    const buffer = await renderer(payload);
    parentPort?.postMessage({ id, ok: true, buffer });
  } catch (error) {
    parentPort?.postMessage({
      id,
      ok: false,
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }
}
