import { useState, useMemo } from 'react';
import {
  Plus, Trash2, Check, Clock, AlertTriangle, ChevronDown, ChevronUp,
  User, Users, Copy, Phone, Banknote, SplitSquareHorizontal, FileDown,
} from 'lucide-react';
import Modal from '../Shared/Modal';
import { formatCurrency, formatDate, todayStr, dueDateStatus, daysUntilDue, generateId } from '../../data/store';
import styles from './Receivables.module.scss';

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS = {
  paid:    { label: 'Recebido',       color: '#0ecb81', bg: 'rgba(14,203,129,0.12)',   icon: Check },
  pending: { label: 'Pendente',       color: '#8888bb', bg: 'rgba(136,136,187,0.08)',  icon: Clock },
  urgent:  { label: 'Vence em breve', color: '#ff922b', bg: 'rgba(255,146,43,0.12)',   icon: AlertTriangle },
  overdue: { label: 'Atrasado',       color: '#f03e3e', bg: 'rgba(240,62,62,0.12)',    icon: AlertTriangle },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  const Icon = cfg.icon;
  return (
    <span className={styles.badge} style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function DaysLabel({ dateStr, paid }) {
  if (paid) return null;
  const d = daysUntilDue(dateStr);
  if (d === null) return null;
  if (d < 0)  return <span className={styles.daysLabel} style={{ color: '#f03e3e' }}>Atrasado {Math.abs(d)}d</span>;
  if (d === 0) return <span className={styles.daysLabel} style={{ color: '#ff922b' }}>Hoje!</span>;
  if (d <= 3)  return <span className={styles.daysLabel} style={{ color: '#ff922b' }}>Em {d}d</span>;
  return <span className={styles.daysLabel} style={{ color: '#55557a' }}>Em {d}d</span>;
}

function copyToClipboard(text) {
  if (text) navigator.clipboard.writeText(text).catch(() => {});
}

// ─── PDF EXPORT HELPER ────────────────────────────────────────────────────────
function exportSplitPDF(rec) {
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtDate = (s) => { if (!s) return ''; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };

  const totalPaid    = rec.people.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
  const totalPending = rec.people.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);

  const rows = rec.people.map(p => `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:10px 12px;font-weight:600;color:#1a1a2e">${p.name}</td>
      <td style="padding:10px 12px;color:#5a5a7a">${p.phone || '—'}</td>
      <td style="padding:10px 12px;color:#5a5a7a">${p.pix || '—'}</td>
      <td style="padding:10px 12px;text-align:center">${fmtDate(p.dueDate)}</td>
      <td style="padding:10px 12px;text-align:right;font-weight:700;color:#7c5cfc">${fmt(p.amount)}</td>
      <td style="padding:10px 12px;text-align:center">
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
          background:${p.paid ? '#d1fae5' : '#fef3c7'};color:${p.paid ? '#065f46' : '#92400e'}">
          ${p.paid ? `✓ Pago em ${fmtDate(p.paidDate)}` : 'Pendente'}
        </span>
      </td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Split — ${rec.desc}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f8; color: #1a1a2e; padding: 40px; }
    .container { max-width: 860px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #7c5cfc, #4f46e5); padding: 32px 40px; color: white; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .header p  { font-size: 14px; opacity: 0.8; }
    .stats { display: flex; gap: 0; border-bottom: 1px solid #eee; }
    .stat { flex: 1; padding: 20px 28px; border-right: 1px solid #eee; }
    .stat:last-child { border-right: none; }
    .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #9090aa; margin-bottom: 6px; }
    .stat-value { font-size: 22px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    thead th { padding: 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #9090aa; background: #f8f8fc; border-bottom: 2px solid #eee; }
    thead th:last-child, thead th:nth-child(5) { text-align: right; }
    thead th:nth-child(4) { text-align: center; }
    .footer { padding: 24px 40px; background: #f8f8fc; border-top: 2px solid #eee; display: flex; justify-content: space-between; align-items: center; }
    .footer-note { font-size: 12px; color: #9090aa; }
    .footer-total { font-size: 20px; font-weight: 700; color: #7c5cfc; }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${rec.desc}</h1>
      <p>${rec.notes || ''} · ${rec.people.length} pessoa(s) · Gerado em ${fmtDate(new Date().toISOString().split('T')[0])}</p>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total</div>
        <div class="stat-value" style="color:#7c5cfc">${fmt(rec.totalAmount)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Recebido</div>
        <div class="stat-value" style="color:#059669">${fmt(totalPaid)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Pendente</div>
        <div class="stat-value" style="color:#d97706">${fmt(totalPending)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Pessoas</div>
        <div class="stat-value">${rec.people.length}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Chave Pix</th>
          <th style="text-align:center">Vencimento</th>
          <th style="text-align:right">Valor</th>
          <th style="text-align:center">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span class="footer-note">Finanças Pessoais · Split exportado automaticamente</span>
      <span class="footer-total">Total: ${fmt(rec.totalAmount)}</span>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');
  if (win) setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ─── INSTALLMENT CARD ─────────────────────────────────────────────────────────
function InstallmentCard({ rec, onMarkPaid, onRemove }) {
  const [open, setOpen] = useState(false);
  const totalPaid    = rec.installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  const totalPending = rec.installments.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0);
  const allPaid      = rec.installments.every(i => i.paid);
  const pct          = rec.totalAmount > 0 ? (totalPaid / rec.totalAmount) * 100 : 0;
  const next         = rec.installments.find(i => !i.paid);
  const nextStatus   = next ? dueDateStatus(next.dueDate, false) : null;

  return (
    <div className={`${styles.recCard} ${allPaid ? styles.recCardDone : ''}`}
      style={{ borderColor: nextStatus ? `${STATUS[nextStatus]?.color}30` : undefined }}>

      <div className={styles.recHeader}>
        <div className={styles.recIconWrap} style={{ background: 'rgba(124,92,252,0.12)' }}>
          <User size={18} color="#7c5cfc" />
        </div>
        <div className={styles.recMeta}>
          <div className={styles.recTitleRow}>
            <h4 className={styles.recDesc}>{rec.desc}</h4>
            <span className={styles.recType} style={{ background: 'rgba(124,92,252,0.12)', color: '#7c5cfc' }}>
              Parcelado
            </span>
          </div>
          <p className={styles.recPerson}>
            <User size={12} /> {rec.person.name}
            {rec.person.phone && (
              <span className={styles.contact}><Phone size={11} /> {rec.person.phone}</span>
            )}
            {rec.person.pix && (
              <span className={styles.pix} onClick={() => copyToClipboard(rec.person.pix)} title="Copiar Pix">
                <Banknote size={11} /> {rec.person.pix} <Copy size={10} />
              </span>
            )}
          </p>
          {rec.notes && <p className={styles.recNotes}>{rec.notes}</p>}
        </div>
        <button className="btn btn--icon btn--ghost" onClick={() => onRemove(rec.id)}>
          <Trash2 size={14} />
        </button>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>{rec.installments.filter(i => i.paid).length}/{rec.installments.length} parcelas</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="progress progress--green">
          <div className="progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.progressValues}>
          <span style={{ color: '#0ecb81' }}>Recebido: {formatCurrency(totalPaid)}</span>
          {!allPaid && <span style={{ color: '#ff922b' }}>A receber: {formatCurrency(totalPending)}</span>}
          {allPaid  && <span style={{ color: '#0ecb81', fontWeight: 600 }}>✓ Tudo recebido!</span>}
        </div>
      </div>

      {next && nextStatus !== 'pending' && (
        <div className={styles.nextAlert}
          style={{ background: STATUS[nextStatus].bg, borderColor: `${STATUS[nextStatus].color}30` }}>
          <STATUS[nextStatus].icon size={13} color={STATUS[nextStatus].color} />
          <span style={{ color: STATUS[nextStatus].color }}>
            Próxima parcela: {formatCurrency(next.amount)} — vence {formatDate(next.dueDate)}
          </span>
        </div>
      )}

      <button className={styles.toggleBtn} onClick={() => setOpen(!open)}>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {open ? 'Ocultar parcelas' : 'Ver todas as parcelas'}
      </button>

      {open && (
        <div className={styles.installmentList}>
          {rec.installments.map((inst, idx) => {
            const st = dueDateStatus(inst.dueDate, inst.paid);
            return (
              <div key={inst.id} className={styles.installmentRow} style={{ opacity: inst.paid ? 0.65 : 1 }}>
                <span className={styles.instIdx}>{idx + 1}ª</span>
                <span className={styles.instDate}>{formatDate(inst.dueDate)}</span>
                <span className={styles.instAmount}>{formatCurrency(inst.amount)}</span>
                <DaysLabel dateStr={inst.dueDate} paid={inst.paid} />
                <StatusBadge status={st} />
                {!inst.paid && (
                  <button className={styles.markPaidBtn} onClick={() => onMarkPaid(rec.id, inst.id)}>
                    <Check size={12} /> Recebi
                  </button>
                )}
                {inst.paid && inst.paidDate && (
                  <span className={styles.paidDate}>pago em {formatDate(inst.paidDate)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SPLIT CARD ───────────────────────────────────────────────────────────────
function SplitCard({ rec, onMarkPaid, onRemove, onAddPerson }) {
  const [open, setOpen]               = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [newPerson, setNewPerson]     = useState({ name: '', amount: '', dueDate: todayStr(), phone: '', pix: '' });

  const totalPaid    = rec.people.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
  const totalPending = rec.people.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);
  const allPaid      = rec.people.every(p => p.paid);
  const pct          = rec.totalAmount > 0 ? (totalPaid / rec.totalAmount) * 100 : 0;
  const overdueCount = rec.people.filter(p => !p.paid && dueDateStatus(p.dueDate, false) === 'overdue').length;
  const urgentCount  = rec.people.filter(p => !p.paid && dueDateStatus(p.dueDate, false) === 'urgent').length;

  const handleAddPerson = () => {
    if (!newPerson.name || !newPerson.amount) return;
    onAddPerson(rec.id, {
      name: newPerson.name, amount: parseFloat(newPerson.amount),
      dueDate: newPerson.dueDate, phone: newPerson.phone || null, pix: newPerson.pix || null,
    });
    setNewPerson({ name: '', amount: '', dueDate: todayStr(), phone: '', pix: '' });
    setAddingPerson(false);
  };

  return (
    <div className={`${styles.recCard} ${allPaid ? styles.recCardDone : ''}`}
      style={{ borderColor: overdueCount > 0 ? 'rgba(240,62,62,0.3)' : urgentCount > 0 ? 'rgba(255,146,43,0.3)' : undefined }}>

      <div className={styles.recHeader}>
        <div className={styles.recIconWrap} style={{ background: 'rgba(14,203,129,0.1)' }}>
          <Users size={18} color="#0ecb81" />
        </div>
        <div className={styles.recMeta}>
          <div className={styles.recTitleRow}>
            <h4 className={styles.recDesc}>{rec.desc}</h4>
            <span className={styles.recType} style={{ background: 'rgba(14,203,129,0.1)', color: '#0ecb81' }}>
              <SplitSquareHorizontal size={11} /> Split
            </span>
          </div>
          <p className={styles.splitSummary}>
            {rec.people.length} pessoas · Total: {formatCurrency(rec.totalAmount)}
          </p>
          {rec.notes && <p className={styles.recNotes}>{rec.notes}</p>}
        </div>
        {/* Action buttons */}
        <div className={styles.recActions}>
          <button className={`btn btn--sm ${styles.exportBtn}`}
            onClick={() => exportSplitPDF(rec)} title="Exportar PDF">
            <FileDown size={13} /> Exportar PDF
          </button>
          <button className="btn btn--icon btn--ghost" onClick={() => onRemove(rec.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {(overdueCount > 0 || urgentCount > 0) && (
        <div className={styles.alertRow}>
          {overdueCount > 0 && (
            <span className={styles.alertChip} style={{ background: 'rgba(240,62,62,0.1)', color: '#f03e3e' }}>
              <AlertTriangle size={12} /> {overdueCount} atrasado(s)
            </span>
          )}
          {urgentCount > 0 && (
            <span className={styles.alertChip} style={{ background: 'rgba(255,146,43,0.1)', color: '#ff922b' }}>
              <AlertTriangle size={12} /> {urgentCount} vence em breve
            </span>
          )}
        </div>
      )}

      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>{rec.people.filter(p => p.paid).length}/{rec.people.length} pessoas pagaram</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="progress progress--green">
          <div className="progress__fill" style={{ width: `${pct}%` }} />
        </div>
        <div className={styles.progressValues}>
          <span style={{ color: '#0ecb81' }}>Recebido: {formatCurrency(totalPaid)}</span>
          {!allPaid && <span style={{ color: '#ff922b' }}>Falta: {formatCurrency(totalPending)}</span>}
          {allPaid  && <span style={{ color: '#0ecb81', fontWeight: 600 }}>✓ Todos pagaram!</span>}
        </div>
      </div>

      <button className={styles.toggleBtn} onClick={() => setOpen(!open)}>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        {open ? 'Ocultar pessoas' : `Ver ${rec.people.length} pessoas`}
      </button>

      {open && (
        <div className={styles.peopleList}>
          {rec.people.map(person => {
            const st  = dueDateStatus(person.dueDate, person.paid);
            const cfg = STATUS[st];
            return (
              <div key={person.id} className={styles.personRow}
                style={{ borderColor: `${cfg.color}25`, opacity: person.paid ? 0.7 : 1 }}>
                <div className={styles.personAvatar} style={{ background: `${cfg.color}18`, color: cfg.color }}>
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.personInfo}>
                  <p className={styles.personName} style={{ textDecoration: person.paid ? 'line-through' : 'none' }}>
                    {person.name}
                  </p>
                  <div className={styles.personContacts}>
                    {person.phone && <span className={styles.contact}><Phone size={11} /> {person.phone}</span>}
                    {person.pix && (
                      <span className={styles.pix} onClick={() => copyToClipboard(person.pix)} title="Copiar chave Pix">
                        <Banknote size={11} /> {person.pix} <Copy size={10} />
                      </span>
                    )}
                  </div>
                  <div className={styles.personMeta}>
                    <span className={styles.instDate}>{formatDate(person.dueDate)}</span>
                    <DaysLabel dateStr={person.dueDate} paid={person.paid} />
                    <StatusBadge status={st} />
                    {person.paid && person.paidDate && (
                      <span className={styles.paidDate}>pago em {formatDate(person.paidDate)}</span>
                    )}
                  </div>
                </div>
                <div className={styles.personRight}>
                  <span className={styles.personAmount}>{formatCurrency(person.amount)}</span>
                  {!person.paid && (
                    <button className={styles.markPaidBtn} onClick={() => onMarkPaid(rec.id, person.id)}>
                      <Check size={12} /> Recebi
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!addingPerson ? (
            <button className={styles.addPersonBtn} onClick={() => setAddingPerson(true)}>
              <Plus size={14} /> Adicionar pessoa
            </button>
          ) : (
            <div className={styles.addPersonForm}>
              <p className={styles.addPersonTitle}>Nova pessoa no split</p>
              <div className={styles.addPersonGrid}>
                <input className="form-input" placeholder="Nome *" value={newPerson.name}
                  onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} />
                <input className="form-input" type="number" placeholder="Valor R$ *" value={newPerson.amount}
                  onChange={e => setNewPerson({ ...newPerson, amount: e.target.value })} />
                <input className="form-input" type="date" value={newPerson.dueDate}
                  onChange={e => setNewPerson({ ...newPerson, dueDate: e.target.value })} />
                <input className="form-input" placeholder="Telefone" value={newPerson.phone}
                  onChange={e => setNewPerson({ ...newPerson, phone: e.target.value })} />
                <input className="form-input" placeholder="Chave Pix" value={newPerson.pix}
                  onChange={e => setNewPerson({ ...newPerson, pix: e.target.value })} />
              </div>
              <div className={styles.addPersonActions}>
                <button className="btn btn--secondary btn--sm" onClick={() => setAddingPerson(false)}>Cancelar</button>
                <button className="btn btn--primary btn--sm" onClick={handleAddPerson}>Adicionar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ADD INSTALLMENT MODAL ────────────────────────────────────────────────────
function AddInstallmentReceivableModal({ onClose, onSave }) {
  const [form, setForm] = useState({ desc: '', notes: '', person: { name: '', phone: '', pix: '' } });
  const [installments, setInstallments] = useState([{ id: generateId(), dueDate: todayStr(), amount: '' }]);

  const addRow    = () => setInstallments(p => [...p, { id: generateId(), dueDate: todayStr(), amount: '' }]);
  const removeRow = (id) => setInstallments(p => p.filter(r => r.id !== id));
  const updateRow = (id, field, value) =>
    setInstallments(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));
  const totalAmount = installments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const handleSave = () => {
    if (!form.desc || !form.person.name || installments.some(i => !i.amount)) return;
    onSave({
      type: 'installment', desc: form.desc, notes: form.notes, person: form.person, totalAmount,
      installments: installments.map(i => ({ ...i, amount: parseFloat(i.amount), paid: false, paidDate: null })),
    });
  };

  return (
    <Modal title="Nova Cobrança Parcelada" onClose={onClose}>
      <div className="form-group">
        <label>Descrição</label>
        <input className="form-input" value={form.desc} placeholder="Ex: Venda do notebook"
          onChange={e => setForm({ ...form, desc: e.target.value })} />
      </div>
      <p className={styles.sectionLabel}>Quem vai te pagar</p>
      <div className="form-row">
        <div className="form-group">
          <label>Nome *</label>
          <input className="form-input" value={form.person.name} placeholder="Nome completo"
            onChange={e => setForm({ ...form, person: { ...form.person, name: e.target.value } })} />
        </div>
        <div className="form-group">
          <label>Telefone</label>
          <input className="form-input" value={form.person.phone} placeholder="(11) 99999-9999"
            onChange={e => setForm({ ...form, person: { ...form.person, phone: e.target.value } })} />
        </div>
      </div>
      <div className="form-group">
        <label>Chave Pix</label>
        <input className="form-input" value={form.person.pix} placeholder="CPF, e-mail ou chave aleatória"
          onChange={e => setForm({ ...form, person: { ...form.person, pix: e.target.value } })} />
      </div>
      <p className={styles.sectionLabel}>Parcelas a receber</p>
      <div className={styles.installmentEditor}>
        {installments.map((inst, idx) => (
          <div key={inst.id} className={styles.instEditorRow}>
            <span className={styles.instEditorIdx}>{idx + 1}ª</span>
            <input className="form-input" type="date" value={inst.dueDate}
              onChange={e => updateRow(inst.id, 'dueDate', e.target.value)} />
            <input className="form-input" type="number" placeholder="R$" value={inst.amount}
              onChange={e => updateRow(inst.id, 'amount', e.target.value)} />
            {installments.length > 1 && (
              <button className="btn btn--icon btn--ghost" onClick={() => removeRow(inst.id)}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        <button className={styles.addInstBtn} onClick={addRow}>
          <Plus size={13} /> Adicionar parcela
        </button>
        {totalAmount > 0 && (
          <div className={styles.totalPreview}>
            Total: <strong>{formatCurrency(totalAmount)}</strong>
          </div>
        )}
      </div>
      <div className="form-group" style={{ marginTop: 12 }}>
        <label>Observações</label>
        <input className="form-input" value={form.notes} placeholder="Opcional"
          onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="form-actions">
        <button className="btn btn--secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn--primary" onClick={handleSave}>Salvar</button>
      </div>
    </Modal>
  );
}

// ─── ADD SPLIT MODAL ──────────────────────────────────────────────────────────
function AddSplitModal({ onClose, onSave }) {
  const [form, setForm] = useState({ desc: '', notes: '', splitEqual: true, equalAmount: '' });
  const [people, setPeople] = useState([
    { id: generateId(), name: '', phone: '', pix: '', amount: '', dueDate: todayStr() },
    { id: generateId(), name: '', phone: '', pix: '', amount: '', dueDate: todayStr() },
  ]);

  const addPerson    = () => setPeople(p => [...p, { id: generateId(), name: '', phone: '', pix: '', amount: '', dueDate: todayStr() }]);
  const removePerson = (id) => { if (people.length > 2) setPeople(p => p.filter(r => r.id !== id)); };
  const updatePerson = (id, field, value) =>
    setPeople(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));

  const totalAmount = form.splitEqual
    ? (parseFloat(form.equalAmount) || 0) * people.length
    : people.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

  const handleSave = () => {
    if (!form.desc || people.some(p => !p.name)) return;
    const finalPeople = people.map(p => ({
      ...p,
      amount: form.splitEqual ? parseFloat(form.equalAmount) || 0 : parseFloat(p.amount) || 0,
      paid: false, paidDate: null,
    }));
    onSave({ type: 'split', desc: form.desc, notes: form.notes, totalAmount, people: finalPeople });
  };

  return (
    <Modal title="Novo Split / Racha" onClose={onClose}>
      <div className="form-group">
        <label>Descrição</label>
        <input className="form-input" value={form.desc} placeholder="Ex: Churrasco, viagem, jantar..."
          onChange={e => setForm({ ...form, desc: e.target.value })} />
      </div>
      <div className={styles.splitTypeToggle}>
        <button className={`${styles.splitTypeBtn} ${form.splitEqual ? styles.splitTypeBtnActive : ''}`}
          onClick={() => setForm({ ...form, splitEqual: true })}>Dividir igual</button>
        <button className={`${styles.splitTypeBtn} ${!form.splitEqual ? styles.splitTypeBtnActive : ''}`}
          onClick={() => setForm({ ...form, splitEqual: false })}>Valores diferentes</button>
      </div>
      {form.splitEqual && (
        <div className="form-row">
          <div className="form-group">
            <label>Valor por pessoa (R$)</label>
            <input className="form-input" type="number" value={form.equalAmount}
              placeholder="0,00" onChange={e => setForm({ ...form, equalAmount: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Vencimento padrão</label>
            <input className="form-input" type="date" value={people[0]?.dueDate || todayStr()}
              onChange={e => setPeople(p => p.map(r => ({ ...r, dueDate: e.target.value })))} />
          </div>
        </div>
      )}
      <p className={styles.sectionLabel}>Pessoas ({people.length})</p>
      <div className={styles.peopleEditor}>
        {people.map((person, idx) => (
          <div key={person.id} className={styles.personEditorRow}>
            <div className={styles.personEditorAvatar}>{idx + 1}</div>
            <div className={styles.personEditorFields}>
              <input className="form-input" placeholder="Nome *" value={person.name}
                onChange={e => updatePerson(person.id, 'name', e.target.value)} />
              <div className={styles.personEditorSub}>
                <input className="form-input" placeholder="Telefone" value={person.phone}
                  onChange={e => updatePerson(person.id, 'phone', e.target.value)} />
                <input className="form-input" placeholder="Chave Pix" value={person.pix}
                  onChange={e => updatePerson(person.id, 'pix', e.target.value)} />
                {!form.splitEqual && (
                  <>
                    <input className="form-input" type="number" placeholder="R$" value={person.amount}
                      onChange={e => updatePerson(person.id, 'amount', e.target.value)} />
                    <input className="form-input" type="date" value={person.dueDate}
                      onChange={e => updatePerson(person.id, 'dueDate', e.target.value)} />
                  </>
                )}
              </div>
            </div>
            <button className="btn btn--icon btn--ghost" onClick={() => removePerson(person.id)}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <button className={styles.addInstBtn} onClick={addPerson}>
          <Plus size={13} /> Adicionar pessoa
        </button>
        {totalAmount > 0 && (
          <div className={styles.totalPreview}>
            Total: <strong>{formatCurrency(totalAmount)}</strong>
          </div>
        )}
      </div>
      <div className="form-group" style={{ marginTop: 12 }}>
        <label>Observações</label>
        <input className="form-input" value={form.notes} placeholder="Opcional"
          onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="form-actions">
        <button className="btn btn--secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn--primary" onClick={handleSave}>Salvar</button>
      </div>
    </Modal>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Receivables({ receivables, addReceivable, removeReceivable,
  markInstallmentPaid, markPersonPaid, addPersonToSplit }) {

  const [modal, setModal]       = useState(null);
  const [filterType, setFilterType] = useState('all');

  const stats = useMemo(() => {
    let totalReceived = 0, totalPending = 0, overdueCount = 0;
    receivables.forEach(r => {
      if (r.type === 'installment') {
        r.installments.forEach(i => {
          if (i.paid) totalReceived += i.amount;
          else {
            totalPending += i.amount;
            if (dueDateStatus(i.dueDate, false) === 'overdue') overdueCount++;
          }
        });
      } else {
        r.people.forEach(p => {
          if (p.paid) totalReceived += p.amount;
          else {
            totalPending += p.amount;
            if (dueDateStatus(p.dueDate, false) === 'overdue') overdueCount++;
          }
        });
      }
    });
    return { totalReceived, totalPending, overdueCount };
  }, [receivables]);

  const filtered = receivables.filter(r => {
    if (filterType === 'installment') return r.type === 'installment';
    if (filterType === 'split')       return r.type === 'split';
    if (filterType === 'pending') {
      if (r.type === 'installment') return r.installments.some(i => !i.paid);
      return r.people.some(p => !p.paid);
    }
    return true;
  });

  return (
    <div className="page">
      <div className="page__header">
        <h2>A Receber</h2>
        <div className={styles.addBtnGroup}>
          <button className="btn btn--secondary" onClick={() => setModal('installment')}>
            <User size={15} /> Parcelado
          </button>
          <button className="btn btn--primary" onClick={() => setModal('split')}>
            <Users size={15} /> Split / Racha
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryBlock} style={{ borderColor: 'rgba(14,203,129,0.3)' }}>
          <span className={styles.summaryLabel}>Total recebido</span>
          <span className={styles.summaryValue} style={{ color: '#0ecb81' }}>{formatCurrency(stats.totalReceived)}</span>
        </div>
        <div className={styles.summaryBlock} style={{ borderColor: 'rgba(255,146,43,0.3)' }}>
          <span className={styles.summaryLabel}>A receber</span>
          <span className={styles.summaryValue} style={{ color: '#ff922b' }}>{formatCurrency(stats.totalPending)}</span>
        </div>
        <div className={styles.summaryBlock} style={{ borderColor: stats.overdueCount > 0 ? 'rgba(240,62,62,0.3)' : undefined }}>
          <span className={styles.summaryLabel}>Em atraso</span>
          <span className={styles.summaryValue} style={{ color: stats.overdueCount > 0 ? '#f03e3e' : 'var(--text-muted)' }}>
            {stats.overdueCount} item(s)
          </span>
        </div>
        <div className={styles.summaryBlock}>
          <span className={styles.summaryLabel}>Total cadastrado</span>
          <span className={styles.summaryValue}>{receivables.length} cobranças</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {[
          { id: 'all',         label: 'Todos' },
          { id: 'pending',     label: 'Pendentes' },
          { id: 'installment', label: 'Parcelados' },
          { id: 'split',       label: 'Splits' },
        ].map(f => (
          <button key={f.id}
            className={`${styles.filterBtn} ${filterType === f.id ? styles.filterBtnActive : ''}`}
            onClick={() => setFilterType(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🤝</div>
            <p>Nenhuma cobrança encontrada</p>
          </div>
        ) : filtered.map(rec =>
          rec.type === 'installment' ? (
            <InstallmentCard key={rec.id} rec={rec}
              onMarkPaid={markInstallmentPaid} onRemove={removeReceivable} />
          ) : (
            <SplitCard key={rec.id} rec={rec}
              onMarkPaid={markPersonPaid} onRemove={removeReceivable} onAddPerson={addPersonToSplit} />
          )
        )}
      </div>

      {modal === 'installment' && (
        <AddInstallmentReceivableModal
          onClose={() => setModal(null)}
          onSave={(data) => { addReceivable(data); setModal(null); }} />
      )}
      {modal === 'split' && (
        <AddSplitModal
          onClose={() => setModal(null)}
          onSave={(data) => { addReceivable(data); setModal(null); }} />
      )}
    </div>
  );
}
