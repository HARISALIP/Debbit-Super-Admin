import { useState, useMemo, ReactNode } from 'react'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T extends Record<string, unknown>> {
  title: string
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  rowKey?: (row: T) => string
  actions?: (row: T) => ReactNode
  pageSize?: number
  pageSizeOptions?: number[]
}

type SortDir = 'asc' | 'desc'

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search records…',
  rowKey,
  actions,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
}: DataTableProps<T>) {
  const [query, setQuery]         = useState('')
  const [sortKey, setSortKey]     = useState<string | null>(null)
  const [sortDir, setSortDir]     = useState<SortDir>('asc')
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(initialPageSize)

  // ── Filter ──
  const filtered = useMemo(() => {
    if (!query.trim()) return data
    const q = query.toLowerCase()
    return data.filter(row =>
      Object.values(row).some(v =>
        v !== null && v !== undefined && String(v).toLowerCase().includes(q)
      )
    )
  }, [data, query])

  // ── Sort ──
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? ''
      const bv = b[sortKey] ?? ''
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // ── Paginate ──
  const totalItems = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const paginated = sorted.slice(startIndex, endIndex)

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  function handleSearch(v: string) {
    setQuery(v)
    setPage(1)
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize)
    setPage(1)
  }

  // Generate page range
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('…')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }
    return pages
  }, [totalPages, currentPage])

  return (
    <div className="table-wrap">
      {/* Toolbar */}
      <div className="table-toolbar">
        <h2>
          {title}
          <span className="badge badge-muted" style={{ fontWeight: 600 }}>{filtered.length}</span>
        </h2>
        {searchable && (
          <input
            className="table-search"
            type="text"
            placeholder={searchPlaceholder}
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading table data…</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>{query ? 'No matching records found for your search.' : 'No data records available.'}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width, textAlign: col.align || 'left' }}
                    onClick={() => col.sortable !== false && handleSort(String(col.key))}
                  >
                    {col.header}
                    {sortKey === String(col.key) && (
                      <span style={{ marginLeft: '6px', color: 'var(--violet-light)' }}>
                        {sortDir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                ))}
                {actions && <th style={{ width: '180px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, i) => (
                <tr key={rowKey ? rowKey(row) : i}>
                  {columns.map(col => (
                    <td key={String(col.key)} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row) : String(row[String(col.key)] ?? '—')}
                    </td>
                  ))}
                  {actions && <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="pagination-bar">
          <div className="pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'nowrap' }}>
            <span style={{ whiteSpace: 'nowrap' }}>
              Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalItems}</strong> entries
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per page:</span>
              <select
                className="form-select"
                style={{ width: '70px', padding: '2px 8px', fontSize: '12px', height: '30px', display: 'inline-block' }}
                value={pageSize}
                onChange={e => handlePageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pagination-controls">
            <button
              className="page-btn"
              disabled={currentPage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              ← Prev
            </button>

            {pageNumbers.map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={idx}
                  className={`page-btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ) : (
                <span key={idx} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                  …
                </span>
              )
            )}

            <button
              className="page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
