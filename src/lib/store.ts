import { api } from './api-client';
import type { CaseStatus, PoliceCase, AppNotification } from './types';

type CaseCreateInput = Omit<
  PoliceCase,
  'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt' |
  'integrityHash' | 'createdByUid' | 'createdByUsername' | 'status' | 'deadlineAt'
> & { status?: CaseStatus };

export async function fetchCases(): Promise<PoliceCase[]> {
  const { cases } = await api.get<{ cases: PoliceCase[] }>('/api/cases');
  return cases;
}

export async function fetchCase(id: string): Promise<PoliceCase> {
  const { case: c } = await api.get<{ case: PoliceCase }>(`/api/cases/${id}`);
  return c;
}

export async function createCase(input: CaseCreateInput): Promise<PoliceCase> {
  const { case: c } = await api.post<{ case: PoliceCase }>('/api/cases', input);
  return c;
}

export async function updateCase(id: string, data: Partial<PoliceCase>, passwordConfirm: string): Promise<PoliceCase> {
  const { case: c } = await api.put<{ case: PoliceCase }>(`/api/cases/${id}`, { data, passwordConfirm });
  return c;
}

export async function updateCaseStatus(id: string, status: CaseStatus, passwordConfirm: string): Promise<void> {
  await api.patch(`/api/cases/${id}/status`, { status, passwordConfirm });
}

export async function deleteCase(id: string, passwordConfirm: string): Promise<void> {
  await api.delete(`/api/cases/${id}`, { passwordConfirm });
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { notifications } = await api.get<{ notifications: AppNotification[] }>('/api/notifications');
  return notifications;
}

export async function triggerExpiredCheck(): Promise<{ checked: number; created: number }> {
  return api.post<{ checked: number; created: number }>('/api/notifications/check-expired', {});
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/api/notifications/${id}`, {});
}
