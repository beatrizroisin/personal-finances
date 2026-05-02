import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const FriendsContext = createContext(null)

export function FriendsProvider({ children }) {
  const { user } = useAuth()
  const [friends, setFriends]           = useState([]) // accepted
  const [pendingIn, setPendingIn]       = useState([]) // requests TO me
  const [pendingOut, setPendingOut]     = useState([]) // requests FROM me
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]           = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Friendships
      const { data: fships } = await supabase
        .from('friendships')
        .select(`
          id, status, created_at, requester_id, addressee_id,
          requester:profiles!friendships_requester_id_fkey(id, name),
          addressee:profiles!friendships_addressee_id_fkey(id, name)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

      const accepted = [], inbound = [], outbound = []
      ;(fships || []).forEach(f => {
        const isRequester = f.requester_id === user.id
        const friend = isRequester ? f.addressee : f.requester
        const entry = { id: f.id, status: f.status, friendId: friend?.id, friendName: friend?.name, createdAt: f.created_at }
        if (f.status === 'accepted') accepted.push(entry)
        else if (f.status === 'pending') {
          if (isRequester) outbound.push(entry)
          else inbound.push({ ...entry, requesterId: f.requester_id, requesterName: f.requester?.name })
        }
      })
      setFriends(accepted)
      setPendingIn(inbound)
      setPendingOut(outbound)

      // Notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications(notifs || [])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) { setFriends([]); setPendingIn([]); setPendingOut([]); setNotifications([]); return }
    loadAll()

    // Realtime: listen for new notifications
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

  // ── Send friend request ────────────────────────────────────────────────────
  const sendFriendRequest = useCallback(async (email) => {
    // Find user by email via profiles
    // Using maybeSingle() to avoid 406 error when user not found
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (error) return { error: 'Erro ao buscar usuário: ' + error.message }
    if (!profile) return { error: 'Nenhum usuário encontrado com esse e-mail. Confirme se o amigo já tem conta no app.' }

    if (profile.id === user.id) return { error: 'Você não pode se adicionar.' }

    const { error: insertError } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: profile.id, status: 'pending' })

    if (insertError) {
      if (insertError.code === '23505') return { error: 'Solicitação já enviada.' }
      return { error: insertError.message }
    }

    // Send notification to the addressee
    await supabase.from('notifications').insert({
      user_id: profile.id,
      from_user_id: user.id,
      type: 'friend_request',
      title: 'Novo pedido de amizade',
      message: `${profile?.name || 'Alguém'} quer se conectar com você no Finanças Pessoais.`,
      data: { requesterId: user.id },
    })

    await loadAll()
    return { success: true }
  }, [user, loadAll])

  // ── Search user by email ───────────────────────────────────────────────────
  const searchUser = useCallback(async (email) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()
    if (error || !data) return null
    return data
  }, [])

  // ── Accept friend request ──────────────────────────────────────────────────
  const acceptFriendRequest = useCallback(async (friendshipId, fromUserId, fromName) => {
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)

    // Notify requester that request was accepted
    const myName = (await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()).data?.name
    await supabase.from('notifications').insert({
      user_id: fromUserId,
      from_user_id: user.id,
      type: 'friend_accepted',
      title: 'Pedido de amizade aceito!',
      message: `${myName || 'Seu amigo'} aceitou seu pedido de amizade.`,
      data: {},
    })

    await loadAll()
  }, [user, loadAll])

  // ── Decline friend request ─────────────────────────────────────────────────
  const declineFriendRequest = useCallback(async (friendshipId) => {
    await supabase.from('friendships').update({ status: 'declined' }).eq('id', friendshipId)
    await loadAll()
  }, [loadAll])

  // ── Remove friend ──────────────────────────────────────────────────────────
  const removeFriend = useCallback(async (friendshipId) => {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await loadAll()
  }, [loadAll])

  // ── Send debt notification ─────────────────────────────────────────────────
  const sendDebtNotification = useCallback(async ({ toUserId, splitDesc, amount, dueDate }) => {
    const myName = (await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()).data?.name
    const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
    await supabase.from('notifications').insert({
      user_id: toUserId,
      from_user_id: user.id,
      type: 'debt_created',
      title: `Você deve ${fmt(amount)}`,
      message: `${myName || 'Seu amigo'} te incluiu no "${splitDesc}" — ${fmt(amount)}${dueDate ? ` até ${dueDate}` : ''}.`,
      data: { amount, splitDesc, dueDate },
    })
  }, [user])

  // ── Mark notifications as read ─────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [user])

  const markOneRead = useCallback(async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  return (
    <FriendsContext.Provider value={{
      friends, pendingIn, pendingOut, notifications, unreadCount, loading,
      sendFriendRequest, searchUser, acceptFriendRequest, declineFriendRequest,
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