import { useState } from 'react';
import { Plus, Trash2, CreditCard, CheckCircle } from 'lucide-react';
import Modal from '../Shared/Modal';
import { formatCurrency, formatDate, todayStr } from '../../data/store';
import styles from './Installments.module.scss';

export default function Installments({ installments, cards, addInstallment, payInstallment, removeInstallment }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ desc: '', monthly: '', totalInstallments: '', dueDay: '15', cardId: '', startDate: todayStr() });

  const totalMonthly   = installments.reduce((s, i) => s + i.monthly, 0);
  const totalRemaining = installments.reduce((s, i) => s + (i.totalInstallments - i.paid) * i.monthly, 0);
  const totalOriginal  = installments.reduce((s, i) => s + i.totalInstallments * i.monthly, 0);

  const getCard = (id) => cards.find(c => c.id === id);

  const handleSubmit = () => {
    if (!form.desc || !form.monthly || !form.totalInstallments) return;
    addInstallment({
      ...form,
      monthly: parseFloat(form.monthly),
      totalInstallments: parseInt(form.totalInstallments),
      dueDay: parseInt(form.dueDay),
      cardId: form.cardId || null,
    });
    setForm({ desc: '', monthly: '', totalInstallments: '', dueDay: '15', cardId: '', startDate: todayStr() });
    setShowModal(false);
  };

  return (
    <div className="page">
      <div className="page__header">
        <h2>Parcelas</h2>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
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
          const card = inst.cardId ? getCard(inst.cardId) : null;
          const pct = (inst.paid / inst.totalInstallments) * 100;
          const remaining = (inst.totalInstallments - inst.paid) * inst.monthly;
          const done = inst.paid >= inst.totalInstallments;

          return (
            <div key={inst.id} className={`${styles.instCard} animate-in`}
              style={{ borderColor: done ? 'rgba(14,203,129,0.3)' : card ? `${card.color}30` : undefined }}>
              <div className={styles.instHeader}>
                <div className={styles.instIconWrap} style={{ background: card ? `${card.color}20` : 'rgba(124,92,252,0.12)' }}>
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
                <button className="btn btn--icon btn--ghost" onClick={() => removeInstallment(inst.id)}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Progress */}
              <div className={styles.instProgress}>
                <div className={styles.instProgressInfo}>
                  <span>{inst.paid}/{inst.totalInstallments} parcelas pagas</span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
                <div className={`progress ${done ? 'progress--green' : ''}`}>
                  <div className="progress__fill" style={{ width: `${pct}%`, ...(card ? { background: card.color } : {}) }} />
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

              {/* Action */}
              {!done ? (
                <button className={styles.payBtn} onClick={() => payInstallment(inst.id)}>
                  <Check size={14} /> Registrar parcela paga
                </button>
              ) : (
                <div className={styles.doneTag}>
                  <CheckCircle size={14} /> Totalmente quitado
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal title="Nova Compra Parcelada" onClose={() => setShowModal(false)}>
          <div className="form-group">
            <label>Descrição do produto</label>
            <input className="form-input" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })}
              placeholder="Ex: iPhone 16 Pro" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor por parcela (R$)</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.monthly}
                onChange={e => setForm({ ...form, monthly: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Nº de parcelas</label>
              <input className="form-input" type="number" min="1" value={form.totalInstallments}
                onChange={e => setForm({ ...form, totalInstallments: e.target.value })} placeholder="Ex: 12" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Dia de vencimento</label>
              <input className="form-input" type="number" min="1" max="31" value={form.dueDay}
                onChange={e => setForm({ ...form, dueDay: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Data da compra</label>
              <input className="form-input" type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Cartão usado</label>
            <select className="form-select" value={form.cardId} onChange={e => setForm({ ...form, cardId: e.target.value })}>
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
            <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleSubmit}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Check({ size, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
