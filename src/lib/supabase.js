import { createClient } from '@supabase/supabase-js'

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
// Cole aqui as credenciais do seu projeto Supabase
// Crie um projeto gratuito em: https://supabase.com
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  || ''
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
export const signUp = (email, password, name) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

export const onAuthChange = (cb) =>
  supabase.auth.onAuthStateChange((_event, session) => cb(session))

// ─── DATA HELPERS (cada operação filtra por user_id automaticamente via RLS) ──

// Lê todos os registros de uma tabela do usuário logado
export const fetchTable = async (table) => {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

// Upsert (insert or update) um array de registros
export const upsertTable = async (table, rows) => {
  if (!rows || rows.length === 0) return
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

// Deleta um registro pelo id
export const deleteRow = async (table, id) => {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

// Substitui toda a tabela do usuário (delete all + insert)
export const replaceTable = async (table, rows, userId) => {
  // Delete all rows for this user
  await supabase.from(table).delete().eq('user_id', userId)
  if (rows && rows.length > 0) {
    const withUser = rows.map(r => ({ ...r, user_id: userId }))
    const { error } = await supabase.from(table).insert(withUser)
    if (error) throw error
  }
}
