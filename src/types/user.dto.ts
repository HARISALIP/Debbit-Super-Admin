export interface UserRow {
  id: string | number
  email: string
  full_name: string
  role: string
  business_name?: string
  last_sign_in: string
  status: 'Active' | 'Inactive' | 'Pending'
}
