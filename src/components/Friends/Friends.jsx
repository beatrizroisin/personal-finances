import { useState } from 'react'
import { UserPlus, Users, Check, X, Trash2, Search, Bell, UserCheck, Clock } from 'lucide-react'
import { useFriends } from '../../context/FriendsContext'
import styles from './Friends.module.scss'

function Avatar({ name, size = 40, color = '#7c5cfc' }) {
  const initials = (name || '?').slice(0, 2).toUpperCase()
  return (
    <div className={styles.avatar} style={{ width: size, height: size, background: `${color}22`, border: `2px solid ${color}44` }}>
      <span style={{ color, fontSize: size * 0.36, fontWeight: 700 }}>{initials}</span>
    </div>
  )
}

export default function Friends() {
  const {
    friends, pendingIn, pendingOut, loading,
    sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend,
  } = useFriends()

  const [searchEmail, setSearchEmail] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchMsg, setSearchMsg]     = useState(null) // { type: 'success'|'error', text }
  const [tab, setTab]                 = useState('friends') // friends | pending | requests

  const handleSendRequest = async (e) => {
    e.preventDefault()
    if (!searchEmail.trim()) return
    setSearchLoading(true)
    setSearchMsg(null)
    const result = await sendFriendRequest(searchEmail.trim())
    if (result?.success) {
      setSearchMsg({ type: 'success', text: 'Solicitação enviada com sucesso!' })
      setSearchEmail('')
    } else {
      setSearchMsg({ type: 'error', text: result?.error || 'Erro ao enviar solicitação.' })
    }
    setSearchLoading(false)
  }

  const TABS = [
    { id: 'friends',  label: 'Amigos',    count: friends.length },
    { id: 'pending',  label: 'Recebidos', count: pendingIn.length },
    { id: 'requests', label: 'Enviados',  count: pendingOut.length },
  ]

  return (
    <div className="page">
      <div className="page__header">
        <h2>Amigos</h2>
      </div>

      {/* Add friend */}
      <div className={styles.addCard}>
        <div className={styles.addCardHeader}>
          <UserPlus size={18} color="#7c5cfc" />
          <h3>Adicionar amigo</h3>
        </div>
        <p className={styles.addCardDesc}>
          Busque pelo e-mail que seu amigo usa no app. Quando ele aceitar, vocês poderão se marcar em splits e cobranças.
        </p>
        <form onSubmit={handleSendRequest} className={styles.searchForm}>
          <div className={styles.searchInputWrap}>
            <Search size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              type="email"
              placeholder="email@do-amigo.com"
              value={searchEmail}
              onChange={e => { setSearchEmail(e.target.value); setSearchMsg(null) }}
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={searchLoading || !searchEmail.trim()}>
            {searchLoading ? <span className={styles.spinner} /> : <><UserPlus size={15} /> Enviar pedido</>}
          </button>
        </form>
        {searchMsg && (
          <p className={styles.searchMsg} style={{ color: searchMsg.type === 'success' ? '#0ecb81' : '#f03e3e' }}>
            {searchMsg.type === 'success' ? '✓ ' : '✗ '}{searchMsg.text}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.count > 0 && (
              <span className={styles.tabBadge} style={{ background: tab === t.id ? 'rgba(255,255,255,0.25)' : '#7c5cfc22', color: tab === t.id ? 'white' : '#7c5cfc' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div className={styles.list}>
          {friends.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><Users size={40} style={{ opacity: 0.2 }} /></div>
              <p>Nenhum amigo ainda.<br />Envie um pedido pelo e-mail acima.</p>
            </div>
          ) : friends.map(f => (
            <div key={f.id} className={styles.friendRow}>
              <Avatar name={f.friendName} />
              <div className={styles.friendInfo}>
                <p className={styles.friendName}>{f.friendName || 'Usuário'}</p>
                <p className={styles.friendSub}><UserCheck size={11} /> Amigo conectado</p>
              </div>
              <button className="btn btn--icon btn--ghost" onClick={() => removeFriend(f.id)} title="Remover amigo">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pending incoming */}
      {tab === 'pending' && (
        <div className={styles.list}>
          {pendingIn.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><Bell size={40} style={{ opacity: 0.2 }} /></div>
              <p>Nenhuma solicitação recebida.</p>
            </div>
          ) : pendingIn.map(f => (
            <div key={f.id} className={styles.friendRow}>
              <Avatar name={f.requesterName} color="#ff922b" />
              <div className={styles.friendInfo}>
                <p className={styles.friendName}>{f.requesterName || 'Usuário'}</p>
                <p className={styles.friendSub}><Clock size={11} /> Quer se conectar com você</p>
              </div>
              <div className={styles.friendActions}>
                <button className={styles.acceptBtn}
                  onClick={() => acceptFriendRequest(f.id, f.requesterId, f.requesterName)}>
                  <Check size={14} /> Aceitar
                </button>
                <button className={styles.declineBtn} onClick={() => declineFriendRequest(f.id)}>
                  <X size={14} /> Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending outgoing */}
      {tab === 'requests' && (
        <div className={styles.list}>
          {pendingOut.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><Clock size={40} style={{ opacity: 0.2 }} /></div>
              <p>Nenhuma solicitação enviada.</p>
            </div>
          ) : pendingOut.map(f => (
            <div key={f.id} className={styles.friendRow}>
              <Avatar name={f.friendName} color="#8888bb" />
              <div className={styles.friendInfo}>
                <p className={styles.friendName}>{f.friendName || 'Usuário'}</p>
                <p className={styles.friendSub}><Clock size={11} /> Aguardando resposta</p>
              </div>
              <span className={styles.pendingTag}>Pendente</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}