export type TelemetrySeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'ERROR'

export interface TelemetryRow {
  id: string | number
  timestamp: string
  event_type: string
  severity: TelemetrySeverity
  business_name: string
  device_info: string
  message: string
}
