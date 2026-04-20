import { useState, useEffect } from 'react'
import { ClipboardList, RefreshCw, Search, User, Briefcase, Shield, Cpu } from 'lucide-react'
import { getActivityLogs } from '../api/rbac'

const ACTOR_ICONS = { admin: Shield, employee: Briefcase, student: User, system: Cpu }
const ACTOR_COLORS = { admin: { bg: '#fef3c7', color: '#92400e' }, employee: { bg: '#dbeafe', color: '#1d4ed8' }, student: { bg: '#dcfce7', color: '#166534' }, system: { bg: '#f3f4f6', color: '#6b7280' } }

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await getActivityLogs(200)
    setLogs(data || [])
    setLoading(false)
  }

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.action?.toLowerCase().includes(q) || l.actor_name?.toLowerCase().includes(q) || l.entity_type?.toLowerCase().includes(q)
    const matchType = !filterType || l.actor_type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="rq-page">
      <div className="rq-header">
        <div className="rq-header-left">
          <div className="rq-header-icon-wrap"><ClipboardList size={22} /></div>
          <div>
            <h1 className="rq-header-title">Activity Logs</h1>
            <p className="rq-header-sub">Audit trail of all system actions with timestamps</p>
          </div>
        </div>
        <div className="rq-header-stats">
          <div className="rq-stat-pill"><span className="rq-stat-val">{logs.length}</span><span className="rq-stat-lbl">Total</span></div>
        </div>
      </div>

      <div className="emp-toolbar">
        <div className="emp-search-wrap">
          <Search size={15} className="emp-search-icon" />
          <input className="emp-search-input" placeholder="Search actions…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="rq-filter-input" style={{ width: 160 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Actors</option>
          <option value="admin">Admin</option>
          <option value="employee">Employee</option>
          <option value="student">Student</option>
          <option value="system">System</option>
        </select>
        <button className="rq-btn-clear" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="rq-section">
        {loading
          ? <div className="si-loading"><div className="spinner" /> Loading logs…</div>
          : filtered.length === 0
            ? <div className="rq-empty"><div className="rq-empty-icon"><ClipboardList size={36} /></div><h3>No logs found</h3></div>
            : (
              <div className="emp-logs-list">
                {filtered.map(log => {
                  const Icon = ACTOR_ICONS[log.actor_type] || User
                  const cfg = ACTOR_COLORS[log.actor_type] || ACTOR_COLORS.system
                  return (
                    <div key={log.id} className="emp-log-item">
                      <div className="emp-log-icon" style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon size={14} />
                      </div>
                      <div className="emp-log-body">
                        <div className="emp-log-action">{log.action}</div>
                        <div className="emp-log-meta">
                          <span className="rq-tag" style={{ background: cfg.bg, color: cfg.color, padding: '1px 7px' }}>{log.actor_type}</span>
                          <span>{log.actor_name || log.actor_id}</span>
                          {log.entity_type && <span style={{ color: 'var(--muted)' }}>· {log.entity_type}</span>}
                          {log.details && Object.keys(log.details).length > 0 && (
                            <span style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>
                              · {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="emp-log-time">{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
            )}
      </div>
    </div>
  )
}
