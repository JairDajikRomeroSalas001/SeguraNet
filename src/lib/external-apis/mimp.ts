import 'server-only';

export async function reportCriticalCase(_caseId: string): Promise<{ status: 'queued' }> {
  // Pendiente de integración real con MIMP. Por ahora encola en logs.
  return { status: 'queued' };
}

export async function getCasesFromSistema(_filters: Record<string, string>): Promise<unknown[]> {
  return [];
}

export async function syncMeasuresOfProtection(): Promise<{ synced: number }> {
  return { synced: 0 };
}
