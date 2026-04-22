import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Modal from '../Shared/Modal';
import { formatCurrency, INVESTMENT_TYPES, todayStr, calcInvestmentReturn } from '../../data/store';
import styles from './Investments.module.scss';

const TYPE_COLORS = {
  'Renda Fixa':    '#4dabf7',
  'Renda Variável':'#f03e3e',
  'FII':           '#7c5cfc',
  'Criptomoedas':  '#ffd43b',
  'Previdência':   '#20c997',
  'Outros':        '#868e96',
};

export default function Investments({ investments, addInvestment, removeInvestment }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ desc: '', amount: '', returnPct: '', type: 'Renda Fixa', startDate: todayStr(), institution: '' });

  const stats = useMemo(() =>
    investments.map(inv => ({
      ...inv,
      ...calcInvestmentReturn(inv.amount, inv.returnPct, inv.startDate),
    })),
    [investments]
  );

  const totalInvested = stats.reduce((s, i) => s + i.amount, 0);
  const totalCurrent  = stats.reduce((s, i) => s + i.current, 0);
  const totalEarned   = totalCurrent - totalInvested;
  const avgReturn     = investments.length > 0
    ? (investments.reduce((s, i) => s + i.returnPct, 0) / investments.length).toFixed(1)
    : 0;

  // Projection data (next 12 months)
  const projectionData = useMemo(() => {
    return Array.from({ length: 13 }, (_, m) => {
      const projected = investments.reduce((s, inv) => {
        const base = calcInvestmentReturn(inv.amount, inv.returnPct, inv.startDate).current;
        return s + base * Math.pow(1 + inv.returnPct / 100 / 12, m);
      }, 0);
      const label = m === 0 ? 'Hoje' : `+${m}m`;
      return { mes: label, valor: Math.round(projected) };
    });
  }, [investments]);

  const handleSubmit = () => {
    if (!form.desc || !form.amount || !form.returnPct) return;
    addInvestment({ ...form, amount: parseFloat(form.amount), returnPct: parseFloat(form.returnPct) });
    setForm({ desc: '', amount: '', returnPct: '', type: 'Renda Fixa', startDate: todayStr(), institution: '' });
    setShowModal(false);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h2>Investimentos</h2>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo investimento
        </button>
      </div>

      {/* Summary */}
      <div className={styles.summary}>
        <div className={styles.summaryBlock} style={{ borderColor: 'rgba(77,171,247,0.3)' }}>
          <span className={styles.summaryLabel}>Total investido</span>
          <span className={styles.summaryValue} style={{ color: '#4dabf7' }}>{formatCurrency(totalInvested)}</span>
        </div>
        <div className={styles.summaryBlock} style={{ borderColor: 'rgba(14,203,129,0.3)' }}>
          <span className={styles.summaryLabel}>Valor atual est.</span>
          <span className={styles.summaryValue} style={{ color: '#0ecb81' }}>{formatCurrency(totalCurrent)}</span>
        </div>
        <div className={styles.summaryBlock} style={{ borderColor: totalEarned >= 0 ? 'rgba(14,203,129,0.3)' : 'rgba(240,62,62,0.3)' }}>
          <span className={styles.summaryLabel}>Rendimento total</span>
          <span className={styles.summaryValue} style={{ color: totalEarned >= 0 ? '#0ecb81' : '#f03e3e' }}>
            +{formatCurrency(totalEarned)}
          </span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Rentab. média a.a.</span>
          <span className={styles.summaryValue}>{avgReturn}%</span>
        </div>
      </div>

      {/* Projection chart */}
      {investments.length > 0 && (
        <div className={`card ${styles.projCard}`}>
          <h3 className={styles.chartTitle}>Projeção — próximos 12 meses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#55557a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55557a', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)}
                contentStyle={{ background: '#13132a', border: '1px solid #1e1e3f', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="valor" stroke="#0ecb81" strokeWidth={2.5}
                dot={false} activeDot={{ r: 5, fill: '#0ecb81' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Investment cards */}
      <div className={styles.grid}>
        {stats.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="icon">📈</div>
            <p>Nenhum investimento cadastrado</p>
          </div>
        ) : stats.map(inv => {
          const color = TYPE_COLORS[inv.type] || '#868e96';
          const gainPct = inv.amount > 0 ? ((inv.earned / inv.amount) * 100).toFixed(2) : 0;
          return (
            <div key={inv.id} className={`${styles.invCard} animate-in`}
              style={{ borderColor: `${color}30` }}>
              <div className={styles.invHeader}>
                <div className={styles.invIcon} style={{ background: `${color}18`, color }}>
                  <TrendingUp size={18} />
                </div>
                <div className={styles.invTitle}>
                  <p className={styles.invDesc}>{inv.desc}</p>
                  <p className={styles.invInst}>{inv.institution}</p>
                </div>
                <div className={styles.invType} style={{ background: `${color}18`, color }}>{inv.type}</div>
                <button className="btn btn--icon btn--ghost" onClick={() => removeInvestment(inv.id)}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className={styles.invValues}>
                <div className={styles.invValBlock}>
                  <span className={styles.invValLabel}>Aplicado</span>
                  <span className={styles.invValBig}>{formatCurrency(inv.amount)}</span>
                </div>
                <div className={styles.invArrow} style={{ color }}>→</div>
                <div className={styles.invValBlock} style={{ textAlign: 'right' }}>
                  <span className={styles.invValLabel}>Valor atual est.</span>
                  <span className={styles.invValBig} style={{ color }}>{formatCurrency(inv.current)}</span>
                </div>
              </div>

              <div className={styles.invFooter}>
                <span className={styles.invRate}>{inv.returnPct}% a.a.</span>
                <span className={styles.invGain} style={{ color: '#0ecb81' }}>
                  +{formatCurrency(inv.earned)} ({gainPct}%)
                </span>
                <span className={styles.invDate}>desde {inv.startDate}</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Novo Investimento" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Descrição</label>
            <input className="form-input" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
              placeholder="Ex: CDB Nubank 110% CDI" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor aplicado (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Rentab. anual (%)</label>
              <input className="form-input" type="number" min="0" step="0.1" value={form.returnPct}
                onChange={e => setForm({ ...form, returnPct: e.target.value })} placeholder="Ex: 12.5" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo</label>
              <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {INVESTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Data de início</label>
              <input className="form-input" type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Instituição</label>
            <input className="form-input" value={form.institution}
              onChange={e => setForm({ ...form, institution: e.target.value })}
              placeholder="Ex: Nubank, XP, Tesouro Nacional…" />
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
