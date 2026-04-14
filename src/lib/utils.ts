import React from 'react'

export function statusColor(status: string) {
  const m: Record<string, string> = {
    Open: 'badge-yellow',
    'In Progress': 'badge-blue',
    'Waiting on User': 'badge-purple',
    Resolved: 'badge-green',
    Closed: 'badge-gray',
  }
  return `badge ${m[status] ?? 'badge-gray'}`
}

export function priorityStyle(priority: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    Critical: { color: 'var(--red)', fontWeight: 600 },
    High: { color: 'var(--orange)', fontWeight: 500 },
    Medium: { color: 'var(--foreground)' },
    Low: { color: 'var(--foreground-muted)' },
  }
  return map[priority] ?? {}
}
