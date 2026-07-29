export interface BillingRow {
  id: string | number
  business_name: string
  plan: 'Growth Plan' | 'Enterprise' | 'Starter' | 'Basic'
  amount: string
  billing_cycle: string
  next_billing: string
  status: 'Paid' | 'Past Due' | 'Trial' | 'Cancelled'
}
