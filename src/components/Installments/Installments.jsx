import { useState } from 'react'
import { Plus, Trash2, Pencil, CreditCard, CheckCircle } from 'lucide-react'
import Modal from '../Shared/Modal'
import { formatCurrency, todayStr } from '../../data/store'
import styles from './Installments.module.scss'

function CheckIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const EMPTY_FORM = { desc: '', monthly: '', totalInstallments: '', dueDay: '15', cardId: '', startDate: todayStr() }

export default function Installments({ installments, cards, addInstallment, editInstallment, payInstallment, removeInstallment }) {
  const [modal, setModal] = useState(null) // null | { mode, inst? }

  const form = modal?.inst ?? EMPTY_FORM
  const setForm = (updates) => setModal(prev => ({ ...prev, inst: { ...(prev.inst ?? EMPTY_FORM), ...updates } }))

  const totalMonthly   = installments.reduce((s, i) => s + i.monthly, 0)
  const totalRemaining = installments.reduce((s, i) => s + (i.totalInstallments - i.paid) * i.monthly, 0)
  const totalOriginal  = installments.reduce((s, i) => s + i.totalInstallments * i.monthly, 0)

  const getCard = (id) => cards.find(c => c.id === id)

  const openAdd  = () => setModal({ mode: 'add', inst: { ...EMPTY_FORM } })
  const openEdit = (inst) => setModal({
    mode: 'edit',
    inst: {
      ...inst,
      monthly: String(inst.monthly),
      totalInstallments: String(inst.totalInstallments),
      dueDay: String(inst.dueDay),
      cardId: inst.cardId || '',
    },
  })

  const handleSubmit = () => {
    if (!form.desc || !form.monthly || !form.totalInstallments) return
    if (modal.mode === 'add') {
      addInstallment({
        ...form,
        monthly: parseFloat(form.monthly),
        totalInstallments: parseInt(form.totalInstallments),
        dueDay: parseInt(form.dueDay),
        cardId: form.cardId || null,
        total: parseFloat(form.monthly) * parseInt(form.totalInstallments),
      })
    } else {
      editInstallment(form.id, {
        ...form,
        cardId: form.cardId || null,
      })
    }
    setModal(null)
  }

  const isEdit = modal?.mode === 'edit'

  return (
    <div className="page">
      <div className="page__header">
        <h2>Parcelas</h2>
        <button className="btn btn--primary" onClick={openAdd}>
          <Plus size={16} /> Nova parcela
        </button>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Mensal total</span>
          <span className={styles.summaryValue} style={{ color: '#7c5cfc' }}>{formatCurrency(totalMonthly)}</span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Saldo devedor</span>
          <span className={styles.summaryValue} style={{ color: '#f03e3e' }}>{formatCurrency(totalRemaining)}</span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Total original</span>
          <span className={styles.summaryValue}>{formatCurrency(totalOriginal)}</span>
        </div>
      </div>

      {/* Cards */}
      <div className={styles.grid}>
        {installments.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="icon">💳</div>
            <p>Nenhuma parcela cadastrada</p>
          </div>
        ) : installments.map(inst => {
          const card = inst.cardId ? getCard(inst.cardId) : null
          const pct  = (inst.paid / inst.totalInstallments) * 100
          const remaining = (inst.totalInstallments - inst.paid) * inst.monthly
          const done = inst.paid >= inst.totalInstallments

          return (
            <div key={inst.id} className={`${styles.instCard} animate-in`}
              style={{ borderColor: done ? 'rgba(14,203,129,0.3)' : card ? `${card.color}30` : undefined }}>
              <div className={styles.instHeader}>
                <div className={styles.instIconWrap}
                  style={{ background: card ? `${card.color}20` : 'rgba(124,92,252,0.12)' }}>
                  <CreditCard size={18} color={card ? card.color : '#7c5cfc'} />
                </div>
                <div className={styles.instTitle}>
                  <p className={styles.instDesc}>{inst.desc}</p>
                  {card && (
                    <span className={styles.instCard2} style={{ color: card.color }}>
                      {card.name} ···{card.lastFour}
                    </span>
                  )}
                </div>
                <button className="btn btn--icon btn--ghost" onClick={() => openEdit(inst)} title="Editar">
                  <Pencil size={13} />
                </button>
                <button className="btn btn--icon btn--ghost" onClick={() => removeInstallment(inst.id)} title="Excluir">
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Progress */}
              <div className={styles.instProgress}>
                <div className={styles.instProgressInfo}>
                  <span>{inst.paid}/{inst.totalInstallments} parcelas pagas</span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
                <div className={`progress ${done ? 'progress--green' : ''}`}>
                  <div className="progress__fill"
                    style={{ width: `${pct}%`, ...(card ? { background: card.color } : {}) }} />
                </div>
              </div>

              {/* Values */}
              <div className={styles.instValues}>
                <div>
                  <p className={styles.instValLabel}>Parcela mensal</p>
                  <p className={styles.instValBig}>{formatCurrency(inst.monthly)}</p>
                  <p className={styles.instValSub}>Vence dia {inst.dueDay}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className={styles.instValLabel}>Restante</p>
                  <p className={styles.instValBig} style={{ color: done ? '#0ecb81' : '#f03e3e' }}>
                    {done ? 'Quitado!' : formatCurrency(remaining)}
                  </p>
                  <p className={styles.instValSub}>{inst.totalInstallments - inst.paid} parcela(s)</p>
                </div>
              </div>

              {!done ? (
                <button className={styles.payBtn} onClick={() => payInstallment(inst.id)}>
                  <CheckIcon size={14} /> Registrar parcela paga
                </button>
              ) : (
                <div className={styles.doneTag}>
                  <CheckCircle size={14} /> Totalmente quitado
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={isEdit ? 'Editar Parcela' : 'Nova Compra Parcelada'} onClose={() => setModal(null)}>
          <div className="form-group">
            <label>Descrição do produto</label>
            <input className="form-input" value={form.desc}
              onChange={e => setForm({ desc: e.target.value })} placeholder="Ex: iPhone 16 Pro" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor por parcela (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.monthly}
                onChange={e => setForm({ monthly: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Nº de parcelas</label>
              <input className="form-input" type="number" min="1" value={form.totalInstallments}
                onChange={e => setForm({ totalInstallments: e.target.value })} placeholder="Ex: 12" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Dia de vencimento</label>
              <input className="form-input" type="number" min="1" max="31" value={form.dueDay}
                onChange={e => setForm({ dueDay: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Data da compra</label>
              <input className="form-input" type="date" value={form.startDate}
                onChange={e => setForm({ startDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Cartão usado</label>
            <select className="form-select" value={form.cardId}
              onChange={e => setForm({ cardId: e.target.value })}>
              <option value="">Selecionar cartão</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.name} ···{c.lastFour}</option>)}
            </select>
          </div>
          {form.monthly && form.totalInstallments && (
            <div className={styles.calcPreview}>
              <span>Total da compra:</span>
              <strong>{formatCurrency(parseFloat(form.monthly || 0) * parseInt(form.totalInstallments || 0))}</strong>
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
