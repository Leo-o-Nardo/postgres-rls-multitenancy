import axios from 'axios';

// 10.0.2.2 is the host machine as seen from the Android emulator.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8000/api';

const api = axios.create({ baseURL: API_URL, timeout: 5000 });

export interface Tenant {
  id: string;
  name: string;
}

export interface Stats {
  write_speed: number;
  read_latency_ms: number;
  total_rows: number;
  active_partition: string;
}

const tenantHeader = (tenantId: string) => ({ headers: { 'X-Tenant-ID': tenantId } });

export async function fetchTenants(): Promise<Tenant[]> {
  const { data } = await api.get<Tenant[]>('/tenants');
  return data;
}

export async function fetchStats(tenantId: string): Promise<Stats> {
  const { data } = await api.get<Stats>('/stress/stats', tenantHeader(tenantId));
  return data;
}

export async function injectRows(tenantId: string, amount: number): Promise<void> {
  await api.post('/stress/start', { amount }, tenantHeader(tenantId));
}
