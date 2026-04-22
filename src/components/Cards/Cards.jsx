import { useState, useMemo } from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '../Shared/Modal';
import { formatCurrency, BANK_OPTIONS, generateId } from '../../data/store';
import styles from './Cards.module.scss';

export default function Cards({ cards, transactions, installments, addCard, removeCard }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', bank: 'nubank', limit: '', lastFour: '', color: '#820ad1' });

  // Per-card spend from transactions this month
  const cardStats = useMemo(() => {
    return cards.map(card => {
      const txExpenses = transactions
        .filter(t => t.cardId === card.id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      const instMonthly = installments
        .filter(i => i.cardId === card.id && i.paid < i.totalInstallments)
        .reduce((s, i) => s + i.monthly, 0);
      const total = txExpenses + instMonthly;
      const usagePct = card.limit > 0 ? Math.min((total / card.limit) * 100, 100) : 0;
      return { ...card, txExpenses, instMonthly, total, usagePct };
    });
  }, [cards, transactions, installments]);

  // Pie chart data
  const pieData = cardStats.filter(c => c.total > 0).map(c => ({ name: c.name, value: c.total, color: c.color }));
  const mostUsed = [...cardStats].sort((a, b) => b.total - a.total)[0];

  const handleBankChange = (bank) => {
    const bankOpt = BANK_OPTIONS.find(b => b.value === bank);
    setForm({ ...form, bank, color: bankOpt?.color || '#7c5cfc' });
  };

  const handleSubmit = () => {
    if (!form.name || !form.lastFour) return;
    addCard({ ...form, limit: parseFloat(form.limit) || 0 });
    setForm({ name: '', bank: 'nubank', limit: '', lastFour: '', color: '#820ad1' });
    setShowModal(false);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h2>Cartões</h2>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Adicionar cartão
        </button>
      </div>

      {/* Overview chart */}
      {pieData.length > 0 && (
        <div className={`card ${styles.overviewCard}`}>
          <div className={styles.overviewLeft}>
            <h3 className={styles.chartTitle}>Gasto por cartão</h3>
            {mostUsed && (
              <div className={styles.mostUsed}>
                <span className={styles.mostUsedLabel}>Mais utilizado</span>
                <span className={styles.mostUsedName} style={{ color: mostUsed.color }}>
                  {mostUsed.name}
                </span>
                <span className={styles.mostUsedValue}>{formatCurrency(mostUsed.total)}</span>
              </div>
            )}
            <div className={styles.pieLegend}>
              {pieData.map(d => (
                <div key={d.name} className={styles.pieLegendItem}>
                  <span className={styles.pieDot} style={{ background: d.color }} />
                  <span className={styles.pieName}>{d.name}</span>
                  <span className={styles.pieVal}>{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.overviewRight}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={pieData} cx={95} cy={95} innerRadius={55} outerRadius={88}
                  dataKey="value" paddingAngle={4}>
                  {pieData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)}
                  contentStyle={{ background: '#13132a', border: '1px solid #1e1e3f', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className={styles.cardGrid}>
        {cards.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="icon">💳</div>
            <p>Nenhum cartão cadastrado</p>
          </div>
        ) : cardStats.map(card => (
          <div key={card.id} className={`${styles.creditCard} animate-in`}>
            {/* Card visual */}
            <div className={styles.cardVisual} style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}aa)` }}>
              <div className={styles.cardChip} />
              <div className={styles.cardNum}>•••• •••• •••• {card.lastFour}</div>
              <div className={styles.cardBot}>
                <span className={styles.cardName}>{card.name}</span>
                <CreditCard size={20} opacity={0.7} />
              </div>
            </div>

            {/* Usage info */}
            <div className={styles.cardBody}>
              {card.limit > 0 && (
                <div className={styles.limitRow}>
                  <div className={styles.limitInfo}>
                    <span className={styles.limitLabel}>Uso do limite</span>
                    <span className={styles.limitPct} style={{
                      color: card.usagePct > 80 ? '#f03e3e' : card.usagePct > 50 ? '#ff922b' : '#0ecb81'
                    }}>{card.usagePct.toFixed(1)}%</span>
                  </div>
                  <div className="progress" style={{ marginBottom: 8 }}>
                    <div className="progress__fill" style={{
                      width: `${card.usagePct}%`,
                      background: card.usagePct > 80 ? '#f03e3e' : card.usagePct > 50 ? '#ff922b' : card.color,
                    }} />
                  </div>
                  <div className={styles.limitValues}>
                    <span>{formatCurrency(card.total)} usado</span>
                    <span>{formatCurrency(card.limit)} limite</span>
                  </div>
                </div>
              )}

              <div className={styles.statsRow}>
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>Transações</span>
                  <span className={styles.statVal}>{formatCurrency(card.txExpenses)}</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>Parcelas/mês</span>
                  <span className={styles.statVal}>{formatCurrency(card.instMonthly)}</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statBlock}>
                  <span className={styles.statLabel}>Total gasto</span>
                  <span className={styles.statVal} style={{ color: card.color }}>{formatCurrency(card.total)}</span>
                </div>
              </div>

              <button className="btn btn--danger btn--sm" style={{ marginTop: 8 }} onClick={() => removeCard(card.id)}>
                <Trash2 size={13} /> Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Adicionar Cartão" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Nome do cartão</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Nubank Platinum" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Banco / Emissor</label>
              <select className="form-select" value={form.bank} onChange={e => handleBankChange(e.target.value)}>
                {BANK_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Últimos 4 dígitos</label>
              <input className="form-input" maxLength={4} value={form.lastFour}
                onChange={e => setForm({ ...form, lastFour: e.target.value.replace(/\D/g, '') })}
                placeholder="0000" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Limite (R$)</label>
              <input className="form-input" type="number" min="0" value={form.limit}
                onChange={e => setForm({ ...form, limit: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Cor personalizada</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  style={{ width: 44, height: 38, borderRadius: 8, border: '1px solid #1e1e3f',
                    background: 'transparent', cursor: 'pointer', padding: 2 }} />
                <span style={{ fontSize: 12, color: '#8888bb' }}>{form.color}</span>
              </div>
            </div>
          </div>
          {/* Card preview */}
          <div className={styles.cardPreview} style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}aa)` }}>
            <div className={styles.cardChip} />
            <div className={styles.cardNum}>•••• •••• •••• {form.lastFour || '0000'}</div>
            <div className={styles.cardBot}>
              <span className={styles.cardName}>{form.name || 'Seu cartão'}</span>
              <CreditCard size={18} opacity={0.7} />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleSubmit}>Adicionar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
