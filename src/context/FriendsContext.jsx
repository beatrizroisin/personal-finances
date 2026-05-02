import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FriendsContext = createContext(null)

export function FriendsProvider({ children }) {
  const { user, profile: myProfile } = useAuth()
  const [friends,       setFriends]       = useState([])
  const [pendingIn,     setPendingIn]     = useState([])
  const [pendingOut,    setPendingOut]    = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length
  const myName = myProfile?.name || user?.email?.split('@')[0] || 'Usuário'

  // ── Helper: fetch profile name by id ────────────────────────────────────────
  const fetchProfileName = async (id) => {
    if (!id) return 'Usuário'
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', id)
      .maybeSingle()
    return data?.name || 'Usuário'
  }

  // ── Load all friendships + notifications ────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Get raw friendships rows (no join — avoids FK name issues)
      const { data: fships, error: fErr } = await supabase
        .from('friendships')
        .select('id, status, created_at, requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      if (fErr) console.error('loadAll friendships error:', fErr)

      // 2. Collect all unique profile IDs to fetch (other side of each friendship)
      const otherIds = [...new Set(
        (fships || []).map(f => f.requester_id === user.id ? f.addressee_id : f.requester_id)
      )]

      // 3. Fetch profiles for those IDs in one query
      const profileMap = {}
      if (otherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', otherIds)
        ;(profiles || []).forEach(p => { profileMap[p.id] = p })
      }

      // 4. Build state arrays
      const accepted = [], inbound = [], outbound = []
      ;(fships || []).forEach(f => {
        const isRequester = f.requester_id === user.id
        const otherId     = isRequester ? f.addressee_id : f.requester_id
        const otherName   = profileMap[otherId]?.name || 'Usuário'

        const entry = {
          id: f.id,
          status: f.status,
          friendId: otherId,
          friendName: otherName,
          createdAt: f.created_at,
        }

        if (f.status === 'accepted') {
          accepted.push(entry)
        } else if (f.status === 'pending') {
          if (isRequester) {
            outbound.push(entry)
          } else {
            inbound.push({ ...entry, requesterId: f.requester_id, requesterName: otherName })
          }
        }
      })

      setFriends(accepted)
      setPendingIn(inbound)
      setPendingOut(outbound)

      // 5. Load notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications(notifs || [])

    } catch (err) {
      console.error('loadAll error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  // ── Subscribe to realtime notifications + load on mount ────────────────────
  useEffect(() => {
    if (!user) {
      setFriends([]); setPendingIn([]); setPendingOut([]); setNotifications([])
      return
    }
    loadAll()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, loadAll])

  // ── Send friend request ─────────────────────────────────────────────────────
  const sendFriendRequest = useCallback(async (email) => {
    const trimmedEmail = email.toLowerCase().trim()

    // Find target user by email
    const { data: targetProfile, error: searchErr } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', trimmedEmail)
      .maybeSingle()

    if (searchErr) return { error: 'Erro ao buscar: ' + searchErr.message }
    if (!targetProfile) return { error: 'Nenhum usuário encontrado com esse e-mail. Confirme se o amigo já tem conta no app.' }
    if (targetProfile.id === user.id) return { error: 'Você não pode adicionar a si mesmo.' }

    // Insert friendship
    const { error: insertErr } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: targetProfile.id, status: 'pending' })

    if (insertErr) {
      if (insertErr.code === '23505') return { error: 'Você já enviou um pedido para essa pessoa.' }
      return { error: 'Erro ao enviar pedido: ' + insertErr.message }
    }

    // Notify target user — use MY name (myName), not the target's name
    await supabase.from('notifications').insert({
      user_id:      targetProfile.id,  // who receives the notification
      from_user_id: user.id,
      type:         'friend_request',
      title:        'Novo pedido de amizade',
      message:      `${myName} quer se conectar com você no Finanças Pessoais.`,
      data:         { requesterId: user.id },
    })

    await loadAll()
    return { success: true }
  }, [user, myName, loadAll])

  // ── Accept friend request ───────────────────────────────────────────────────
  const acceptFriendRequest = useCallback(async (friendshipId, fromUserId) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    if (error) { console.error('accept error:', error); return }

    // Notify requester — use MY name
    await supabase.from('notifications').insert({
      user_id:      fromUserId,
      from_user_id: user.id,
      type:         'friend_accepted',
      title:        'Pedido de amizade aceito! 🎉',
      message:      `${myName} aceitou seu pedido de amizade. Agora vocês podem se marcar em splits!`,
      data:         {},
    })

    await loadAll()
  }, [user, myName, loadAll])

  // ── Decline friend request ──────────────────────────────────────────────────
  const declineFriendRequest = useCallback(async (friendshipId) => {
    await supabase.from('friendships').update({ status: 'declined' }).eq('id', friendshipId)
    await loadAll()
  }, [loadAll])

  // ── Remove friend ───────────────────────────────────────────────────────────
  const removeFriend = useCallback(async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await loadAll()
  }, [loadAll])

  // ── Send debt notification ──────────────────────────────────────────────────
  const sendDebtNotification = useCallback(async ({ toUserId, splitDesc, amount, dueDate }) => {
    const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
    await supabase.from('notifications').insert({
      user_id:      toUserId,
      from_user_id: user.id,
      type:         'debt_created',
      title:        `Você deve ${fmt(amount)}`,
      message:      `${myName} te incluiu no "${splitDesc}" — ${fmt(amount)}${dueDate ? ` até ${dueDate}` : ''}.`,
      data:         { amount, splitDesc, dueDate },
    })
  }, [user, myName])

  // ── Mark notifications as read ──────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [user])

  const markOneRead = useCallback(async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  return (
    <FriendsContext.Provider value={{
      friends, pendingIn, pendingOut, notifications, unreadCount, loading,
      sendFriendRequest, acceptFriendRequest, declineFriendRequest,
      removeFriend, sendDebtNotification, markAllRead, markOneRead, loadAll,
    }}>
      {children}
    </FriendsContext.Provider>
  )
}

export const useFriends = () => {
  const ctx = useContext(FriendsContext)
  if (!ctx) throw new Error('useFriends must be inside FriendsProvider')
  return ctx
}