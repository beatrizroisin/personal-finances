import { useState } from 'react';
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft, Filter } from 'lucide-react';
import Modal from '../Shared/Modal';
import { formatCurrency, formatDate, CATEGORIES, CATEGORY_COLORS, todayStr, generateId } from '../../data/store';
import styles from './Transactions.module.scss';

export default function Transactions({ transactions, cards, addTransaction, removeTransaction }) {
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ desc: '', amount: '', category: 'Alimentação', date: todayStr(), type: 'expense', cardId: '' });

  const filtered = transactions
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => !catFilter || t.category === catFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalIn  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleSubmit = () => {
    if (!form.desc || !form.amount) return;
    addTransaction({ ...form, amount: parseFloat(form.amount), cardId: form.cardId || null });
    setForm({ desc: '', amount: '', category: 'Alimentação', date: todayStr(), type: 'expense', cardId: '' });
    setShowModal(false);
  };

  const getCard = (id) => cards.find(c => c.id === id);

  return (
    <div className="page">
      <div className="page__header">
        <h2>Lançamentos</h2>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo lançamento
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          {['all', 'income', 'expense'].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Gastos'}
            </button>
          ))}
        </div>
        <select className="form-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}>
          <option value="">Todas categorias</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary row */}
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

      {/* Transaction list */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>Nenhum lançamento encontrado</p>
          </div>
        ) : filtered.map(t => {
          const card = t.cardId ? getCard(t.cardId) : null;
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
                  <span className="badge" style={{ background: `${CATEGORY_COLORS[t.category]}20`, color: CATEGORY_COLORS[t.category] }}>
                    {t.category}
                  </span>
                  {card && (
                    <span className={styles.cardTag} style={{ borderColor: card.color, color: card.color }}>
                      {card.name} ···{card.lastFour}
                    </span>
                  )}
                  <span className={styles.itemDate}>{formatDate(t.date)}</span>
                </div>
              </div>
              <div className={styles.itemRight}>
                <p className={styles.itemAmount} style={{ color: t.type === 'income' ? '#0ecb81' : '#f03e3e' }}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </p>
                <button className="btn btn--icon btn--ghost" onClick={() => removeTransaction(t.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title="Novo Lançamento" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Tipo</label>
            <div className={styles.typeSwitch}>
              {['expense', 'income'].map(t => (
                <button key={t}
                  className={`${styles.typeSwitchBtn} ${form.type === t ? styles.typeSwitchActive : ''}`}
                  style={form.type === t ? { background: t === 'income' ? 'rgba(14,203,129,0.2)' : 'rgba(240,62,62,0.2)', borderColor: t === 'income' ? '#0ecb81' : '#f03e3e', color: t === 'income' ? '#0ecb81' : '#f03e3e' } : {}}
                  onClick={() => setForm({ ...form, type: t })}>
                  {t === 'expense' ? '↓ Gasto' : '↑ Receita'}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Descrição</label>
            <input className="form-input" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Ex: Supermercado" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Data</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Categoria</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Cartão (opcional)</label>
              <select className="form-select" value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })}>
                <option value="">Nenhum / Débito</option>
                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleSubmit}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
