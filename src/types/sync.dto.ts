export interface WorkstationRow {
  id: string | number
  name: string
  business_name: string
  last_sync: string
  pending_sync_count: number
  status: 'Healthy' | 'Syncing' | 'Offline' | 'Error'
}

export interface DeviceKeyRow {
  id: string | number
  device_name: string
  key_prefix: string
  created_at: string
  status: 'Active' | 'Revoked'
}
