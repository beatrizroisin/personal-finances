import { useState, useRef, useEffect } from 'react'
import { Bell, Check, UserPlus, UserCheck, DollarSign, X } from 'lucide-react'
import { useFriends } from '../../context/FriendsContext'
import styles from './NotificationsBell.module.scss'

const TYPE_CONFIG = {
  friend_request: { icon: UserPlus,   color: '#7c5cfc', label: 'Pedido de amizade' },
  friend_accepted: { icon: UserCheck, color: '#0ecb81', label: 'Amizade aceita' },
  debt_created:   { icon: DollarSign, color: '#ff922b', label: 'Nova dívida' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'agora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function NotificationsBell() {
  const { notifications, unreadCount, markAllRead, markOneRead } = useFriends()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    setOpen(prev => !prev)
  }

  const handleMarkAll = async () => {
    await markAllRead()
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.bell} onClick={handleOpen} title="Notificações">
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>
            <h4>Notificações</h4>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={handleMarkAll}>
                <Check size={12} /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>
                <Bell size={28} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>Nenhuma notificação</p>
              </div>
            ) : notifications.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.debt_created
              const Icon = cfg.icon
              return (
                <div key={n.id}
                  className={`${styles.notifRow} ${!n.read ? styles.notifUnread : ''}`}
                  onClick={() => markOneRead(n.id)}>
                  <div className={styles.notifIcon} style={{ background: `${cfg.color}18` }}>
                    <Icon size={14} color={cfg.color} />
                  </div>
                  <div className={styles.notifContent}>
                    <p className={styles.notifTitle}>{n.title}</p>
                    <p className={styles.notifMsg}>{n.message}</p>
                    <p className={styles.notifTime}>{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <div className={styles.unreadDot} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}