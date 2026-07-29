import { ReactNode } from 'react'

export interface ColumnDef<T> {
  key: keyof T | string
  header: string
  width?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T> {
  title?: string
  subtitle?: string
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  searchPlaceholder?: string
  rowKey?: (row: T) => string | number
  actions?: (row: T) => ReactNode
  pageSizeOptions?: number[]
  initialPageSize?: number
}
