import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, Info, AlertTriangle, UserPlus, GraduationCap } from 'lucide-react'
import { getStudents } from '../api/students'

const ICON_MAP = {
  info:    <Info size={15} strokeWidth={2} />,
  warning: <AlertTriangle size={15} strokeWidth={2} />,
  student: <UserPlus size={15} strokeWidth={2} />,
  grade:   <GraduationCap size={15} strokeWidth={2} />,
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef(null)

  // Generate notifications based on real student data
  useEffect(() => {
    getStudents().then(({ data }) => {
      const notifs = []

      // Students with suspension
      const withViolations = data.filter(s => s.violations?.length > 0)
      if (withViolations.length > 0) {
        notifs.push({
          id: 'v1', type: 'warning', read: false,
          title: 'Students with Suspension',
          message: `${withViolations.length} student${withViolations.length > 1 ? 's have' : ' has'} recorded suspension.`,
          time: 'Today',
        })
      }

      // Not enrolled students
      const notEnrolled = data.filter(s => !s.year_level)
      if (notEnrolled.length > 0) {
        notifs.push({
          id: 'e1', type: 'info', read: false,
          title: 'Not Enrolled Students',
          message: `${notEnrolled.length} student${notEnrolled.length > 1 ? 's are' : ' is'} currently not enrolled.`,
          time: 'Today',
        })
      }

      // Recently added (last 3)
      if (data.length > 0) {
        notifs.push({
          id: 'r1', type: 'student', read: false,
          title: 'Student Records',
          message: `${data.length} total student${data.length > 1 ? 's' : ''} in the system.`,
          time: 'Today',
        })
      }

      // System notification
      notifs.push({
        id: 's1', type: 'info', read: true,
        title: 'System Ready',
        message: 'Student Profiling System is running normally.',
        time: 'Earlier',
      })

      setNotifications(notifs)
      setUnread(notifs.filter(n => !n.read).length)
    }).catch(() => {
      setNotifications([{
        id: 's1', type: 'info', read: true,
        title: 'System Ready',
        message: 'Student Profiling System is running.',
        time: 'Now',
      }])
    })
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const handleOpen = () => {
    setOpen(o => !o)
  }

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button className="icon-btn notif-btn" title="Notifications" onClick={handleOpen}>
        <Bell size={18} strokeWidth={1.8} className="icon-bell" />
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unread > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                <CheckCheck size={13} strokeWidth={2} /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">No notifications</div>
            )}
            {notifications.map(n => (
              <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'} notif-${n.type}`}>
                <div className={`notif-item-icon notif-icon-${n.type}`}>
                  {ICON_MAP[n.type]}
                </div>
                <div className="notif-item-body">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-msg">{n.message}</div>
                  <div className="notif-item-time">{n.time}</div>
                </div>
                <button className="notif-dismiss" onClick={() => dismiss(n.id)}>
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
