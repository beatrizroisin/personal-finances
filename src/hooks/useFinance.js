import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { generateId, todayStr, currentMonthKey, resetRecurringIfNewMonth } from '../data/store'

// ─── DB ↔ APP field mappings ─────────────────────────────────────────────────
const fromDb = {
  bank_accounts: r => ({
    id: r.id, name: r.name, bank: r.bank, type: r.type,
    color: r.color, balance: r.balance, agency: r.agency,
    accountNum: r.account_num, notes: r.notes,
  }),
  balance_history: r => ({
    id: r.id, bankAccountId: r.bank_account_id,
    balance: r.balance, recordedAt: r.recorded_at,
  }),
  cards:        r => ({ id: r.id, name: r.name, bank: r.bank, limit: r.card_limit, color: r.color, lastFour: r.last_four }),
  transactions: r => ({ id: r.id, desc: r.description, amount: r.amount, category: r.category, date: r.date, type: r.type, cardId: r.card_id, bankAccountId: r.bank_account_id }),
  bills:        r => ({ id: r.id, desc: r.description, amount: r.amount, dueDay: r.due_day, paid: r.paid, paidMonth: r.paid_month, category: r.category, recurring: r.recurring }),
  installments: r => ({ id: r.id, desc: r.description, monthly: r.monthly, totalInstallments: r.total_installments, paid: r.paid, dueDay: r.due_day, cardId: r.card_id, startDate: r.start_date }),
  investments:  r => ({ id: r.id, desc: r.description, amount: r.amount, returnPct: r.return_pct, type: r.type, startDate: r.start_date, institution: r.institution }),
  receivables:  r => ({ ...r.data, id: r.id }),
}

const toDb = {
  bank_accounts: (r, uid) => ({
    id: r.id, user_id: uid, name: r.name, bank: r.bank, type: r.type,
    color: r.color, balance: r.balance, agency: r.agency,
    account_num: r.accountNum, notes: r.notes, updated_at: new Date().toISOString(),
  }),
  balance_history: (r, uid) => ({
    id: r.id, user_id: uid, bank_account_id: r.bankAccountId,
    balance: r.balance, recorded_at: r.recordedAt,
  }),
  cards:        (r, uid) => ({ id: r.id, user_id: uid, name: r.name, bank: r.bank, card_limit: r.limit, color: r.color, last_four: r.lastFour }),
  transactions: (r, uid) => ({ id: r.id, user_id: uid, description: r.desc, amount: r.amount, category: r.category, date: r.date, type: r.type, card_id: r.cardId, bank_account_id: r.bankAccountId }),
  bills:        (r, uid) => ({ id: r.id, user_id: uid, description: r.desc, amount: r.amount, due_day: r.dueDay, paid: r.paid, paid_month: r.paidMonth ?? null, category: r.category, recurring: r.recurring }),
  installments: (r, uid) => ({ id: r.id, user_id: uid, description: r.desc, monthly: r.monthly, total_installments: r.totalInstallments, paid: r.paid, due_day: r.dueDay, card_id: r.cardId, start_date: r.startDate }),
  investments:  (r, uid) => ({ id: r.id, user_id: uid, description: r.desc, amount: r.amount, return_pct: r.returnPct, type: r.type, start_date: r.startDate, institution: r.institution }),
  receivables:  (r, uid) => ({ id: r.id, user_id: uid, data: r }),
}

// ─── DB HELPERS ───────────────────────────────────────────────────────────────
async function fetchTable(table) {
  const { data, error } = await supabase
    .from(table).select('*').order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromDb[table])
}

async function upsertRow(table, row, uid) {
  const { error } = await supabase
    .from(table).upsert(toDb[table](row, uid), { onConflict: 'id' })
  if (error) console.error('upsert error', table, error)
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) console.error('delete error', table, error)
}

async function patchRow(table, id, fields) {
  const { error } = await supabase.from(table).update(fields).eq('id', id)
  if (error) console.error('patch error', table, error)
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export function useFinance() {
  const { user } = useAuth()
  const uid = user?.id

  const [bankAccounts,    setBankAccounts]    = useState([])
  const [balanceHistory,  setBalanceHistory]  = useState([])
  const [cards,           setCards]           = useState([])
  const [transactions,    setTransactions]    = useState([])
  const [bills,           setBills]           = useState([])
  const [installments,    setInstallments]    = useState([])
  const [investments,     setInvestments]     = useState([])
  const [receivables,     setReceivables]     = useState([])
  const [loading,         setLoading]         = useState(true)

  // ── Load all data when user logs in ─────────────────────────────────────
  useEffect(() => {
    if (!uid) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      fetchTable('bank_accounts'),
      fetchTable('balance_history'),
      fetchTable('cards'),
      fetchTable('transactions'),
      fetchTable('bills'),
      fetchTable('installments'),
      fetchTable('investments'),
      fetchTable('receivables'),
    ]).then(([ba, bh, c, t, b, i, inv, rec]) => {
      // Auto-reset recurring bills when entering a new month
      const savedMonth = localStorage.getItem('fp_last_reset_month')
      const { bills: resetBills, resetIds } = resetRecurringIfNewMonth(b, savedMonth)
      if (resetIds.length > 0) {
        localStorage.setItem('fp_last_reset_month', currentMonthKey())
        resetIds.forEach(id => patchRow('bills', id, { paid: false, paid_month: null }))
      }
      setBankAccounts(ba)
      setBalanceHistory(bh)
      setCards(c)
      setTransactions(t)
      setBills(resetBills)
      setInstallments(i)
      setInvestments(inv)
      setReceivables(rec)
    }).catch(err => console.error('Load error:', err))
      .finally(() => setLoading(false))
  }, [uid])

  // ── Clear state on logout ────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) {
      setBankAccounts([]); setBalanceHistory([])
      setCards([]); setTransactions([]); setBills([])
      setInstallments([]); setInvestments([]); setReceivables([])
    }
  }, [uid])

  // ── BANK ACCOUNTS ────────────────────────────────────────────────────────
  const addBankAccount = useCallback(async (data) => {
    const row = { ...data, id: generateId() }
    setBankAccounts(p => [...p, row])
    await upsertRow('bank_accounts', row, uid)
    // Record initial balance in history
    const histRow = { id: generateId(), bankAccountId: row.id, balance: row.balance, recordedAt: todayStr() }
    setBalanceHistory(p => [...p, histRow])
    await upsertRow('balance_history', histRow, uid)
  }, [uid])

  const updateBankBalance = useCallback((id, newBalance) => {
    setBankAccounts(prev => {
      const acc = prev.find(a => a.id === id)
      if (!acc) return prev
      patchRow('bank_accounts', id, { balance: newBalance, updated_at: new Date().toISOString() })
      // Add to history
      const histRow = { id: generateId(), bankAccountId: id, balance: newBalance, recordedAt: todayStr() }
      setBalanceHistory(p => [...p, histRow])
      upsertRow('balance_history', histRow, uid)
      return prev.map(a => a.id === id ? { ...a, balance: newBalance } : a)
    })
  }, [uid])

  const removeBankAccount = useCallback(async (id) => {
    setBankAccounts(p => p.filter(a => a.id !== id))
    setBalanceHistory(p => p.filter(h => h.bankAccountId !== id))
    await deleteRow('bank_accounts', id)
  }, [])

  // ── CARDS ────────────────────────────────────────────────────────────────
  const addCard = useCallback(async (data) => {
    const row = { ...data, id: generateId() }
    setCards(p => [...p, row])
    await upsertRow('cards', row, uid)
  }, [uid])

  const removeCard = useCallback(async (id) => {
    setCards(p => p.filter(c => c.id !== id))
    await deleteRow('cards', id)
  }, [])

  // ── TRANSACTIONS ─────────────────────────────────────────────────────────
  const addTransaction = useCallback(async (data) => {
    const row = { ...data, id: generateId() }
    setTransactions(p => [row, ...p])
    await upsertRow('transactions', row, uid)
  }, [uid])

  const removeTransaction = useCallback(async (id) => {
    setTransactions(p => p.filter(t => t.id !== id))
    await deleteRow('transactions', id)
  }, [])

  // ── BILLS ─────────────────────────────────────────────────────────────────
  const addBill = useCallback(async (data) => {
    const row = { ...data, id: generateId(), paid: false }
    setBills(p => [...p, row])
    await upsertRow('bills', row, uid)
  }, [uid])

  const toggleBill = useCallback((id) => {
    setBills(prev => {
      const bill = prev.find(b => b.id === id)
      if (!bill) return prev
      const newPaid = !bill.paid
      const paidMonth = newPaid ? currentMonthKey() : null
      patchRow('bills', id, { paid: newPaid, paid_month: paidMonth })
      return prev.map(b => b.id === id ? { ...b, paid: newPaid, paidMonth } : b)
    })
  }, [])

  const removeBill = useCallback(async (id) => {
    setBills(p => p.filter(b => b.id !== id))
    await deleteRow('bills', id)
  }, [])

  // ── INSTALLMENTS ─────────────────────────────────────────────────────────
  const addInstallment = useCallback(async (data) => {
    const row = { ...data, id: generateId(), paid: 0 }
    setInstallments(p => [...p, row])
    await upsertRow('installments', row, uid)
  }, [uid])

  const payInstallment = useCallback((id) => {
    setInstallments(prev => {
      const inst = prev.find(i => i.id === id)
      if (!inst || inst.paid >= inst.totalInstallments) return prev
      const newPaid = inst.paid + 1
      patchRow('installments', id, { paid: newPaid })
      return prev.map(i => i.id === id ? { ...i, paid: newPaid } : i)
    })
  }, [])

  const removeInstallment = useCallback(async (id) => {
    setInstallments(p => p.filter(i => i.id !== id))
    await deleteRow('installments', id)
  }, [])

  // ── INVESTMENTS ───────────────────────────────────────────────────────────
  const addInvestment = useCallback(async (data) => {
    const row = { ...data, id: generateId() }
    setInvestments(p => [...p, row])
    await upsertRow('investments', row, uid)
  }, [uid])

  const removeInvestment = useCallback(async (id) => {
    setInvestments(p => p.filter(i => i.id !== id))
    await deleteRow('investments', id)
  }, [])

  // ── RECEIVABLES ──────────────────────────────────────────────────────────
  const addReceivable = useCallback(async (data) => {
    const row = { ...data, id: generateId(), createdAt: todayStr() }
    setReceivables(p => [row, ...p])
    await upsertRow('receivables', row, uid)
  }, [uid])

  const removeReceivable = useCallback(async (id) => {
    setReceivables(p => p.filter(r => r.id !== id))
    await deleteRow('receivables', id)
  }, [])

  const _patchReceivable = useCallback((id, updaterFn) => {
    setReceivables(prev => {
      const rec = prev.find(r => r.id === id)
      if (!rec) return prev
      const updated = updaterFn(rec)
      upsertRow('receivables', updated, uid)
      return prev.map(r => r.id === id ? updated : r)
    })
  }, [uid])

  const markInstallmentPaid = useCallback((receivableId, installmentId) => {
    _patchReceivable(receivableId, r => ({
      ...r,
      installments: r.installments.map(i =>
        i.id === installmentId ? { ...i, paid: true, paidDate: todayStr() } : i
      ),
    }))
  }, [_patchReceivable])

  const markPersonPaid = useCallback((receivableId, personId) => {
    _patchReceivable(receivableId, r => ({
      ...r,
      people: r.people.map(p =>
        p.id === personId ? { ...p, paid: true, paidDate: todayStr() } : p
      ),
    }))
  }, [_patchReceivable])

  const addPersonToSplit = useCallback((receivableId, personData) => {
    _patchReceivable(receivableId, r => ({
      ...r,
      people: [...r.people, { ...personData, id: generateId(), paid: false, paidDate: null }],
    }))
  }, [_patchReceivable])

  return {
    loading,
    bankAccounts, balanceHistory,
    cards, transactions, bills, installments, investments, receivables,
    addBankAccount, updateBankBalance, removeBankAccount,
    addCard, removeCard,
    addTransaction, removeTransaction,
    addBill, toggleBill, removeBill,
    addInstallment, payInstallment, removeInstallment,
    addInvestment, removeInvestment,
    addReceivable, removeReceivable, markInstallmentPaid, markPersonPaid, addPersonToSplit,
  }
}
