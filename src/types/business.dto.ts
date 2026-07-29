export interface BusinessRow {
  id: string | number
  name: string
  legal_name?: string
  country: string
  currency: string
  business_type: string
  created_at: string
  is_active: boolean
}

export interface BusinessDetailDTO extends BusinessRow {
  owner_email?: string
  phone?: string
  address?: string
  subscription_tier?: string
  active_users_count?: number
  workstations_count?: number
  total_revenue_myr?: number
}
