import { useState } from 'react'
import { Plus, Trash2, Pencil, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react'
import Modal from '../Shared/Modal'
import { formatCurrency, CATEGORIES } from '../../data/store'
import styles from './RecurringIncomes.module.scss'

const EMPTY_FORM = { desc: '', amount: '', day: '', category: 'Renda' }

export default function RecurringIncomes({
  recurringIncomes,
  addRecurringIncome,
  editRecurringIncome,
  toggleRecurringIncome,
  removeRecurringIncome,
}) {
  const [modal, setModal] = useState(null)

  const form    = modal?.ri ?? EMPTY_FORM
  const setForm = (updates) => setModal(prev => ({ ...prev, ri: { ...(prev.ri ?? EMPTY_FORM), ...updates } }))

  const totalActive   = recurringIncomes.filter(r => r.active).reduce((s, r) => s + r.amount, 0)
  const totalInactive = recurringIncomes.filter(r => !r.active).reduce((s, r) => s + r.amount, 0)

  const openAdd  = () => setModal({ mode: 'add', ri: { ...EMPTY_FORM } })
  const openEdit = (ri) => setModal({
    mode: 'edit',
    ri: { ...ri, amount: String(ri.amount), day: String(ri.day) },
  })

  const handleSubmit = () => {
    if (!form.desc || !form.amount || !form.day) return
    if (modal.mode === 'add') {
      addRecurringIncome({ ...form, amount: parseFloat(form.amount), day: parseInt(form.day) })
    } else {
      editRecurringIncome(form.id, { ...form })
    }
    setModal(null)
  }

  const isEdit = modal?.mode === 'edit'

  return (
    <div className="page">
      <div className="page__header">
        <h2>Receitas Fixas</h2>
        <button className="btn btn--primary" onClick={openAdd}>
          <Plus size={16} /> Nova receita fixa
        </button>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryBlock} style={{ borderColor: 'rgba(14,203,129,0.3)' }}>
          <span className={styles.summaryLabel}>Total mensal ativo</span>
          <span className={styles.summaryValue} style={{ color: '#0ecb81' }}>
            {formatCurrency(totalActive)}
          </span>
          <span className={styles.summarySub}>projetado todo mês no fluxo de caixa</span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Total inativo</span>
          <span className={styles.summaryValue} style={{ color: 'var(--text-muted)' }}>
            {formatCurrency(totalInactive)}
          </span>
          <span className={styles.summarySub}>não aparece no fluxo</span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Total cadastrado</span>
          <span className={styles.summaryValue}>{recurringIncomes.length}</span>
        </div>
      </div>

      {/* Info banner */}
      <div className={styles.infoBanner}>
        <TrendingUp size={16} color="#0ecb81" />
        <p>
          Receitas ativas são projetadas automaticamente em <strong>todos os meses do Fluxo de Caixa</strong>.
          Para pausar temporariamente sem excluir, use o toggle de ativar/desativar.
        </p>
      </div>

      {/* List */}
      <div className={styles.list}>
        {recurringIncomes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💰</div>
            <p>Nenhuma receita fixa cadastrada.<br />
              Adicione seu salário, aluguel recebido ou qualquer renda recorrente.</p>
          </div>
        ) : (
          <>
            {/* Active */}
            {recurringIncomes.filter(r => r.active).length > 0 && (
              <p className={styles.groupLabel}>Ativas</p>
            )}
            {recurringIncomes.filter(r => r.active).sort((a, b) => a.day - b.day).map(ri => (
              <RecurringIncomeRow key={ri.id} ri={ri}
                onEdit={openEdit}
                onToggle={() => toggleRecurringIncome(ri.id)}
                onRemove={() => removeRecurringIncome(ri.id)} />
            ))}

            {/* Inactive */}
            {recurringIncomes.filter(r => !r.active).length > 0 && (
              <p className={styles.groupLabel} style={{ marginTop: 16 }}>Inativas</p>
            )}
            {recurringIncomes.filter(r => !r.active).sort((a, b) => a.day - b.day).map(ri => (
              <RecurringIncomeRow key={ri.id} ri={ri}
                onEdit={openEdit}
                onToggle={() => toggleRecurringIncome(ri.id)}
                onRemove={() => removeRecurringIncome(ri.id)} />
            ))}
          </>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={isEdit ? 'Editar Receita Fixa' : 'Nova Receita Fixa'} onClose={() => setModal(null)}>
          <div className="form-group">
            <label>Descrição</label>
            <input className="form-input" value={form.desc}
              onChange={e => setForm({ desc: e.target.value })}
              placeholder="Ex: Salário, Aluguel recebido, Freela mensal…" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm({ amount: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Dia do mês que cai</label>
              <input className="form-input" type="number" min="1" max="31" value={form.day}
                onChange={e => setForm({ day: e.target.value })} placeholder="Ex: 5" />
            </div>
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select className="form-select" value={form.category}
              onChange={e => setForm({ category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {form.day && (
            <div className={styles.dayPreview}>
              <TrendingUp size={13} color="#0ecb81" />
              Aparece todo mês no dia <strong>{form.day}</strong> no Fluxo de Caixa
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

function RecurringIncomeRow({ ri, onEdit, onToggle, onRemove }) {
  return (
    <div className={`${styles.item} ${!ri.active ? styles.itemInactive : ''} animate-in`}>
      <div className={styles.itemIcon} style={{ background: ri.active ? 'rgba(14,203,129,0.12)' : 'rgba(136,136,187,0.08)' }}>
        <TrendingUp size={16} color={ri.active ? '#0ecb81' : '#8888bb'} />
      </div>
      <div className={styles.itemInfo}>
        <p className={styles.itemDesc}>{ri.desc}</p>
        <div className={styles.itemMeta}>
          <span className={styles.dayTag}>Todo dia {ri.day}</span>
          <span className={styles.catTag}>{ri.category}</span>
        </div>
      </div>
      <div className={styles.itemRight}>
        <p className={styles.itemAmount} style={{ color: ri.active ? '#0ecb81' : 'var(--text-muted)' }}>
          +{formatCurrency(ri.amount)}
        </p>
        <button className={`${styles.toggleBtn} ${ri.active ? styles.toggleBtnOn : ''}`}
          onClick={onToggle} title={ri.active ? 'Desativar' : 'Ativar'}>
          {ri.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
        </button>
        <button className="btn btn--icon btn--ghost" onClick={() => onEdit(ri)} title="Editar">
          <Pencil size={13} />
        </button>
        <button className="btn btn--icon btn--ghost" onClick={onRemove} title="Excluir">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
