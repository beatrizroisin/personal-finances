import { useState } from 'react'
import { Plus, Trash2, Pencil, ArrowUpRight, ArrowDownLeft, Info } from 'lucide-react'
import Modal from '../Shared/Modal'
import { formatCurrency, formatDate, CATEGORIES, CATEGORY_COLORS, todayStr, getBillingMonth } from '../../data/store'
import styles from './Transactions.module.scss'

const EMPTY_FORM = {
  desc: '', amount: '', category: 'Alimentação', date: todayStr(),
  purchaseDate: todayStr(), type: 'expense', cardId: '',
}

export default function Transactions({ transactions, cards, addTransaction, editTransaction, removeTransaction }) {
  const [filter, setFilter]     = useState('all')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal]       = useState(null)

  const form    = modal?.tx ?? EMPTY_FORM
  const setForm = (updates) => setModal(prev => ({ ...prev, tx: { ...(prev.tx ?? EMPTY_FORM), ...updates } }))

  // When card or purchaseDate changes, recalculate billingMonth
  const handleCardOrDateChange = (updates) => {
    const merged = { ...form, ...updates }
    if (merged.cardId && merged.purchaseDate) {
      const card       = cards.find(c => c.id === merged.cardId)
      const closingDay = card?.closingDay ?? 20
      const billing    = getBillingMonth(merged.purchaseDate, closingDay)
      setForm({ ...updates, billingMonth: billing, date: billing + '-01' })
    } else {
      // No card: billing = purchase date month
      const billing = merged.purchaseDate?.slice(0, 7) ?? merged.date?.slice(0, 7)
      setForm({ ...updates, billingMonth: billing, date: merged.purchaseDate || merged.date })
    }
  }

  const filtered = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => !catFilter || t.category === catFilter)
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalIn  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const openAdd  = () => setModal({ mode: 'add', tx: { ...EMPTY_FORM } })
  const openEdit = (tx) => setModal({
    mode: 'edit',
    tx: {
      ...tx,
      amount: String(tx.amount),
      cardId: tx.cardId || '',
      purchaseDate: tx.purchaseDate || tx.date,
      billingMonth: tx.billingMonth || tx.date?.slice(0, 7),
    },
  })

  const handleSubmit = () => {
    if (!form.desc || !form.amount) return
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      cardId: form.cardId || null,
      purchaseDate: form.purchaseDate || form.date,
      billingMonth: form.billingMonth || form.date?.slice(0, 7),
      // date = first day of billing month (used for cashflow grouping)
      date: form.billingMonth ? form.billingMonth + '-01' : form.date,
    }
    if (modal.mode === 'add') {
      addTransaction(payload)
    } else {
      editTransaction(form.id, payload)
    }
    setModal(null)
  }

  const getCard = (id) => cards.find(c => c.id === id)
  const isEdit  = modal?.mode === 'edit'

  // Billing month label for display
  const billingLabel = (tx) => {
    if (!tx.cardId || !tx.billingMonth) return null
    const bm = tx.billingMonth
    const [y, m] = bm.split('-')
    const d = new Date(parseInt(y), parseInt(m) - 1, 1)
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
  }

  // Preview for modal: show if billing differs from purchase month
  const billingDiffersFromPurchase = form.cardId && form.billingMonth &&
    form.purchaseDate && form.billingMonth !== form.purchaseDate.slice(0, 7)

  return (
    <div className="page">
      <div className="page__header">
        <h2>Lançamentos</h2>
        <button className="btn btn--primary" onClick={openAdd}>
          <Plus size={16} /> Novo lançamento
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {['all', 'income', 'expense'].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Gastos'}
            </button>
          ))}
        </div>
        <select className="form-select" value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}>
          <option value="">Todas categorias</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span style={{ color: '#0ecb81' }}>↑ Entradas</span>
          <strong style={{ color: '#0ecb81' }}>{formatCurrency(totalIn)}</strong>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span style={{ color: '#f03e3e' }}>↓ Saídas</span>
          <strong style={{ color: '#f03e3e' }}>{formatCurrency(totalOut)}</strong>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span>Saldo filtrado</span>
          <strong style={{ color: totalIn - totalOut >= 0 ? '#0ecb81' : '#f03e3e' }}>
            {formatCurrency(totalIn - totalOut)}
          </strong>
        </div>
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>Nenhum lançamento encontrado</p>
          </div>
        ) : filtered.map(t => {
          const card  = t.cardId ? getCard(t.cardId) : null
          const bLabel = billingLabel(t)
          return (
            <div key={t.id} className={`${styles.item} animate-in`}>
              <div className={styles.itemIcon}
                style={{ background: t.type === 'income' ? 'rgba(14,203,129,0.12)' : 'rgba(240,62,62,0.12)' }}>
                {t.type === 'income'
                  ? <ArrowUpRight size={16} color="#0ecb81" />
                  : <ArrowDownLeft size={16} color="#f03e3e" />}
              </div>
              <div className={styles.itemInfo}>
                <p className={styles.itemDesc}>{t.desc}</p>
                <div className={styles.itemMeta}>
                  <span className="badge"
                    style={{ background: `${CATEGORY_COLORS[t.category]}20`, color: CATEGORY_COLORS[t.category] }}>
                    {t.category}
                  </span>
                  {card && (
                    <span className={styles.cardTag} style={{ borderColor: card.color, color: card.color }}>
                      {card.name} ···{card.lastFour}
                    </span>
                  )}
                  {bLabel && (
                    <span className={styles.billingTag} title={`Fatura de ${bLabel}`}>
                      fatura {bLabel}
                    </span>
                  )}
                  <span className={styles.itemDate}>
                    compra {formatDate(t.purchaseDate || t.date)}
                  </span>
                </div>
              </div>
              <div className={styles.itemRight}>
                <p className={styles.itemAmount}
                  style={{ color: t.type === 'income' ? '#0ecb81' : '#f03e3e' }}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
                <button className="btn btn--icon btn--ghost" onClick={() => openEdit(t)} title="Editar">
                  <Pencil size={13} />
                </button>
                <button className="btn btn--icon btn--ghost" onClick={() => removeTransaction(t.id)} title="Excluir">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={isEdit ? 'Editar Lançamento' : 'Novo Lançamento'} onClose={() => setModal(null)}>
          {/* Type switch */}
          <div className="form-group">
            <label>Tipo</label>
            <div className={styles.typeSwitch}>
              {['expense', 'income'].map(t => (
                <button key={t}
                  className={`${styles.typeSwitchBtn} ${form.type === t ? styles.typeSwitchActive : ''}`}
                  style={form.type === t
                    ? { background: t === 'income' ? 'rgba(14,203,129,0.2)' : 'rgba(240,62,62,0.2)',
                        borderColor: t === 'income' ? '#0ecb81' : '#f03e3e',
                        color: t === 'income' ? '#0ecb81' : '#f03e3e' }
                    : {}}
                  onClick={() => setForm({ type: t, cardId: t === 'income' ? '' : form.cardId })}>
                  {t === 'expense' ? '↓ Gasto' : '↑ Receita'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <input className="form-input" value={form.desc}
              onChange={e => setForm({ desc: e.target.value })} placeholder="Ex: Supermercado" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valor (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm({ amount: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Data da compra</label>
              <input className="form-input" type="date" value={form.purchaseDate || form.date}
                onChange={e => handleCardOrDateChange({ purchaseDate: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoria</label>
              <select className="form-select" value={form.category}
                onChange={e => setForm({ category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {form.type === 'expense' && (
              <div className="form-group">
                <label>Cartão (opcional)</label>
                <select className="form-select" value={form.cardId}
                  onChange={e => handleCardOrDateChange({ cardId: e.target.value })}>
                  <option value="">Nenhum / Débito/Dinheiro</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name} (fecha dia {c.closingDay ?? 20})</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Billing month preview */}
          {form.type === 'expense' && form.cardId && (
            <div className={`${styles.billingPreview} ${billingDiffersFromPurchase ? styles.billingPreviewWarn : styles.billingPreviewOk}`}>
              <Info size={14} />
              {billingDiffersFromPurchase
                ? <>Compra dia {formatDate(form.purchaseDate)} — cai na <strong>fatura de {
                    (() => {
                      const [y, m] = form.billingMonth.split('-')
                      return new Date(parseInt(y), parseInt(m)-1, 1)
                        .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    })()
                  }</strong> (após o fechamento do cartão)</>
                : <>Compra cai na fatura deste mês</>
              }
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn--secondary" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleSubmit}>
              {isEdit ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}