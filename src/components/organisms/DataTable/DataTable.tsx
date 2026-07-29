import { useState, useMemo } from 'react'
import { DataTableProps } from '../../../types'
import { dataTableStyles } from './DataTable.styles'

export default function DataTable<T extends Record<string, any>>({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  searchPlaceholder = 'Search records…',
  rowKey,
  actions,
  pageSizeOptions = [5, 10, 20, 50],
  initialPageSize = 10,
}: DataTableProps<T>) {
  const [query, setQuery]         = useState('')
  const [sortKey, setSortKey]     = useState<string | null>(null)
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('asc')
  const [currentPage, setPage]    = useState(1)
  const [pageSize, setPageSize]   = useState(initialPageSize)

  // 1. Search Filter
  const filtered = useMemo(() => {
    if (!query.trim()) return data
    const q = query.toLowerCase()
    return data.filter(row =>
      Object.values(row).some(val =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      )
    )
  }, [data, query])

  // 2. Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  // 3. Pagination
  const totalItems = sorted.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize
  const endIndex   = Math.min(startIndex + pageSize, totalItems)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortKey(null); setSortDir('asc') }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleSearch = (val: string) => {
    setQuery(val)
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  // Generate Page Numbers Array
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('…')
      const start = Math.max(2, currentPage - 1)
      const end   = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }
    return pages
  }, [totalPages, currentPage])

  return (
    <div className="table-wrap">
      {/* Table Header / Toolbar */}
      <div className="table-toolbar">
        <div>
          {title && <h2 style={dataTableStyles.headerText}>{title}</h2>}
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {subtitle}
            </p>
          )}
        </div>

        {searchPlaceholder !== '' && (
          <input
            type="text"
            className="table-search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="loading-state" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading table data…</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="empty-icon" style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {query ? 'No matching records found for your search.' : 'No data records available.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    style={{ width: col.width, textAlign: col.align || 'left', cursor: col.sortable !== false ? 'pointer' : 'default' }}
                    onClick={() => col.sortable !== false && handleSort(String(col.key))}
                  >
                    {col.header}
                    {sortKey === String(col.key) && (
                      <span style={{ marginLeft: '6px', color: 'var(--purple-main)' }}>
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
                  {actions && <td style={dataTableStyles.actionsCell}>{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="pagination-bar">
          <div className="pagination-info" style={dataTableStyles.paginationInfoRow}>
            <span style={{ whiteSpace: 'nowrap' }}>
              Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{totalItems}</strong> entries
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Per page:</span>
              <select
                className="form-select"
                style={dataTableStyles.pageSizeSelect}
                value={pageSize}
                onChange={e => handlePageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map(sz => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pagination-controls" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                <span key={idx} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>{p}</span>
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
