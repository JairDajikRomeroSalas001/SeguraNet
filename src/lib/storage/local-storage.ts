import 'server-only';
import { promises as fs, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { ReadStream } from 'node:fs';

const ROOT = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');

export interface SaveResult {
  storagePath: string;
  absolutePath: string;
  sha256: string;
  sizeBytes: number;
}

function safeJoin(...segments: string[]): string {
  const joined = path.resolve(ROOT, ...segments);
  if (!joined.startsWith(ROOT + path.sep) && joined !== ROOT) {
    throw new Error('Path traversal detectado');
  }
  return joined;
}

export function buildCaseDocumentPath(caseId: string, docId: string, filename: string): string {
  // Path relativo: cases/{caseId}/documents/{docId}/{filename}
  return path.posix.join('cases', caseId, 'documents', docId, filename);
}

export async function ensureUploadRoot(): Promise<void> {
  await fs.mkdir(ROOT, { recursive: true });
}

export async function saveFile(
  storagePath: string,
  data: Buffer | Uint8Array,
): Promise<SaveResult> {
  await ensureUploadRoot();
  const absolute = safeJoin(storagePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, data);

  const sha256 = createHash('sha256').update(data).digest('hex');
  const stat = await fs.stat(absolute);
  return { storagePath, absolutePath: absolute, sha256, sizeBytes: stat.size };
}

export async function readFileStream(storagePath: string): Promise<ReadStream> {
  const absolute = safeJoin(storagePath);
  await fs.access(absolute);
  return createReadStream(absolute);
}

export async function readFileBytes(storagePath: string): Promise<Buffer> {
  const absolute = safeJoin(storagePath);
  return fs.readFile(absolute);
}

export async function fileExists(storagePath: string): Promise<boolean> {
  try {
    await fs.access(safeJoin(storagePath));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(storagePath: string): Promise<void> {
  const absolute = safeJoin(storagePath);
  try { await fs.unlink(absolute); } catch { /* ignored */ }
}
