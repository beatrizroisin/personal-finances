import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, AlertTriangle, Clock } from 'lucide-react'
import Modal from '../Shared/Modal'
import { formatCurrency, CATEGORIES, todayDay } from '../../data/store'
import styles from './Bills.module.scss'

const EMPTY_FORM = { desc: '', amount: '', dueDay: '', category: 'Moradia', recurring: true }

export default function Bills({ bills, addBill, editBill, toggleBill, removeBill }) {
  const [modal, setModal] = useState(null) // null | { mode, bill? }
  const day = todayDay()

  const form   = modal?.bill ?? EMPTY_FORM
  const setForm = (updates) => setModal(prev => ({ ...prev, bill: { ...(prev.bill ?? EMPTY_FORM), ...updates } }))

  const getBillStatus = (bill) => {
    if (bill.paid) return 'paid'
    if (bill.dueDay < day) return 'overdue'
    if (bill.dueDay <= day + 3) return 'urgent'
    return 'pending'
  }

  const sorted = [...bills].sort((a, b) => {
    const order = { overdue: 0, urgent: 1, pending: 2, paid: 3 }
    return order[getBillStatus(a)] - order[getBillStatus(b)] || a.dueDay - b.dueDay
  })

  const totalPaid    = bills.filter(b => b.paid).reduce((s, b) => s + b.amount, 0)
  const totalPending = bills.filter(b => !b.paid).reduce((s, b) => s + b.amount, 0)

  const openAdd  = () => setModal({ mode: 'add', bill: { ...EMPTY_FORM } })
  const openEdit = (bill) => setModal({ mode: 'edit', bill: { ...bill, amount: String(bill.amount), dueDay: String(bill.dueDay) } })

  const handleSubmit = () => {
    if (!form.desc || !form.amount || !form.dueDay) return
    if (modal.mode === 'add') {
      addBill({ ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) })
    } else {
      editBill(form.id, { ...form })
    }
    setModal(null)
  }

  const isEdit = modal?.mode === 'edit'

  const statusConfig = {
    paid:    { label: 'Pago',           color: '#0ecb81', icon: Check,          bg: 'rgba(14,203,129,0.1)'   },
    overdue: { label: 'Atrasado',       color: '#f03e3e', icon: AlertTriangle,  bg: 'rgba(240,62,62,0.1)'    },
    urgent:  { label: 'Vence em breve', color: '#ff922b', icon: AlertTriangle,  bg: 'rgba(255,146,43,0.1)'   },
    pending: { label: 'Pendente',       color: '#8888bb', icon: Clock,          bg: 'rgba(136,136,187,0.08)' },
  }

  return (
    <div className="page">
      <div className="page__header">
        <h2>Contas a Pagar</h2>
        <button className="btn btn--primary" onClick={openAdd}>
          <Plus size={16} /> Nova conta
        </button>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Pago este mês</span>
          <span className={styles.summaryValue} style={{ color: '#0ecb81' }}>{formatCurrency(totalPaid)}</span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Pendente</span>
          <span className={styles.summaryValue} style={{ color: '#ff922b' }}>{formatCurrency(totalPending)}</span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Total mensal</span>
          <span className={styles.summaryValue}>{formatCurrency(totalPaid + totalPending)}</span>
        </div>
      </div>

      {/* Progress */}
      <div className={styles.progressWrap}>
        <div className={styles.progressInfo}>
          <span>{bills.filter(b => b.paid).length} de {bills.length} pagas</span>
          <span>{bills.length > 0 ? ((bills.filter(b => b.paid).length / bills.length) * 100).toFixed(0) : 0}%</span>
        </div>
        <div className="progress progress--green">
          <div className="progress__fill"
            style={{ width: bills.length > 0 ? `${(bills.filter(b => b.paid).length / bills.length) * 100}%` : '0%' }} />
        </div>
      </div>

      {/* List */}
      <div className={styles.list}>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔔</div>
            <p>Nenhuma conta cadastrada</p>
          </div>
        ) : sorted.map(bill => {
          const status = getBillStatus(bill)
          const cfg    = statusConfig[status]
          const Icon   = cfg.icon
          return (
            <div key={bill.id} className={`${styles.item} animate-in`}
              style={{ borderColor: status !== 'pending' ? `${cfg.color}30` : undefined }}>
              <button className={styles.checkBtn} onClick={() => toggleBill(bill.id)}
                style={{
                  background: bill.paid ? 'rgba(14,203,129,0.2)' : 'transparent',
                  borderColor: bill.paid ? '#0ecb81' : 'var(--border-light)',
                }}>
                {bill.paid && <Check size={14} color="#0ecb81" />}
              </button>
              <div className={styles.itemInfo}>
                <p className={styles.itemDesc}
                  style={{ textDecoration: bill.paid ? 'line-through' : 'none', opacity: bill.paid ? 0.5 : 1 }}>
                  {bill.desc}
                </p>
                <div className={styles.itemMeta}>
                  <span className="badge badge--accent">{bill.category}</span>
                  <span className={styles.dueDay}>Dia {bill.dueDay}</span>
                  {bill.recurring && <span className={styles.recurring}>↺ Recorrente</span>}
                </div>
              </div>
              <div className={styles.itemRight}>
                <div className={styles.statusTag} style={{ background: cfg.bg, color: cfg.color }}>
                  <Icon size={11} />
                  <span>{cfg.label}</span>
                </div>
                <p className={styles.amount} style={{ opacity: bill.paid ? 0.5 : 1 }}>
                  {formatCurrency(bill.amount)}
                </p>
                <button className="btn btn--icon btn--ghost" onClick={() => openEdit(bill)} title="Editar">
                  <Pencil size={13} />
                </button>
                <button className="btn btn--icon btn--ghost" onClick={() => removeBill(bill.id)} title="Excluir">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal add/edit */}
      {modal && (
        <Modal title={isEdit ? 'Editar Conta' : 'Nova Conta'} onClose={() => setModal(null)}>
          <div className="form-group">
            <label>Descrição</label>
            <input className="form-input" value={form.desc}
              onChange={e => setForm({ desc: e.target.value })} placeholder="Ex: Aluguel" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm({ amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Dia de vencimento</label>
              <input className="form-input" type="number" min="1" max="31" value={form.dueDay}
                onChange={e => setForm({ dueDay: e.target.value })} placeholder="Ex: 5" />
            </div>
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select className="form-select" value={form.category}
              onChange={e => setForm({ category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row',
              textTransform: 'none', letterSpacing: 0 }}>
              <input type="checkbox" checked={form.recurring}
                onChange={e => setForm({ recurring: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#7c5cfc' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Conta recorrente (mensal)</span>
            </label>
          </div>
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
