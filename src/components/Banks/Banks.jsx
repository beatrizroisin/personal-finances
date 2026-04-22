import { useState, useMemo } from 'react'
import { Plus, Trash2, Pencil, Check, X, TrendingUp, TrendingDown, Building2, History } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import Modal from '../Shared/Modal'
import {
  formatCurrency, formatDate,
  BANK_ACCOUNT_OPTIONS, BANK_ACCOUNT_TYPES, BANK_LOGOS,
} from '../../data/store'
import styles from './Banks.module.scss'

// ─── BANK LOGO / ICON ────────────────────────────────────────────────────────
function BankIcon({ bank, color, size = 36 }) {
  const initials = bank?.slice(0, 2).toUpperCase() || 'BK'
  return (
    <div className={styles.bankIcon}
      style={{ width: size, height: size, background: `${color}22`, border: `1.5px solid ${color}44` }}>
      <span style={{ color, fontSize: size * 0.35, fontWeight: 700 }}>{initials}</span>
    </div>
  )
}

// ─── BALANCE EDITOR (inline) ──────────────────────────────────────────────────
function BalanceEditor({ account, onSave, onCancel }) {
  const [val, setVal] = useState(String(account.balance))

  const handleKey = (e) => {
    if (e.key === 'Enter') onSave(parseFloat(val) || 0)
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className={styles.balanceEditor}>
      <span className={styles.balanceEditorPrefix}>R$</span>
      <input
        className={styles.balanceInput}
        type="number"
        step="0.01"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={handleKey}
        autoFocus
      />
      <button className={styles.balanceBtn} style={{ color: '#0ecb81' }}
        onClick={() => onSave(parseFloat(val) || 0)}>
        <Check size={14} />
      </button>
      <button className={styles.balanceBtn} style={{ color: '#f03e3e' }} onClick={onCancel}>
        <X size={14} />
      </button>
    </div>
  )
}

// ─── HISTORY CHART ────────────────────────────────────────────────────────────
function HistoryChart({ history, color }) {
  if (!history || history.length < 2) {
    return <p className={styles.noHistory}>Histórico disponível após 2+ atualizações de saldo.</p>
  }
  const data = [...history]
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map(h => ({ date: formatDate(h.recordedAt), valor: h.balance }))

  return (
    <ResponsiveContainer width="100%" height={110}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#55557a', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          formatter={v => formatCurrency(v)}
          contentStyle={{ background: '#13132a', border: '1px solid #1e1e3f', borderRadius: 8, fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="valor"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#','')})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── ADD BANK MODAL ───────────────────────────────────────────────────────────
function AddBankModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', bank: 'nubank', type: 'Conta Corrente',
    balance: '', agency: '', accountNum: '', notes: '', color: '#820ad1',
  })

  const handleBankChange = (bank) => {
    const opt = BANK_ACCOUNT_OPTIONS.find(b => b.value === bank)
    setForm(f => ({ ...f, bank, color: opt?.color || '#7c5cfc' }))
  }

  const handleSave = () => {
    if (!form.name || !form.bank) return
    onSave({ ...form, balance: parseFloat(form.balance) || 0 })
  }

  return (
    <Modal title="Adicionar Conta Bancária" onClose={onClose}>
      {/* Preview card */}
      <div className={styles.cardPreview} style={{ background: `linear-gradient(135deg, ${form.color}dd, ${form.color}88)` }}>
        <div className={styles.cardPreviewTop}>
          <Building2 size={20} color="rgba(255,255,255,0.8)" />
          <span className={styles.cardPreviewType}>{form.type}</span>
        </div>
        <p className={styles.cardPreviewName}>{form.name || 'Nome da conta'}</p>
        <p className={styles.cardPreviewBalance}>
          {formatCurrency(parseFloat(form.balance) || 0)}
        </p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Nome da conta *</label>
          <input className="form-input" value={form.name} placeholder="Ex: Nubank Principal"
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Banco *</label>
          <select className="form-select" value={form.bank} onChange={e => handleBankChange(e.target.value)}>
            {BANK_ACCOUNT_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Tipo de conta</label>
          <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {BANK_ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Saldo atual (R$)</label>
          <input className="form-input" type="number" step="0.01" value={form.balance}
            placeholder="0,00" onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Agência</label>
          <input className="form-input" value={form.agency} placeholder="0001"
            onChange={e => setForm(f => ({ ...f, agency: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Nº da conta</label>
          <input className="form-input" value={form.accountNum} placeholder="12345-6"
            onChange={e => setForm(f => ({ ...f, accountNum: e.target.value }))} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Cor personalizada</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              style={{ width: 44, height: 38, borderRadius: 8, border: '1px solid #1e1e3f', background: 'transparent', cursor: 'pointer', padding: 2 }} />
            <span style={{ fontSize: 12, color: '#8888bb' }}>{form.color}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Observações</label>
          <input className="form-input" value={form.notes} placeholder="Opcional"
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn--secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn--primary" onClick={handleSave}>Adicionar conta</button>
      </div>
    </Modal>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function Banks({ bankAccounts, balanceHistory, addBankAccount, updateBankBalance, removeBankAccount }) {
  const [showModal, setShowModal]     = useState(false)
  const [editingId, setEditingId]     = useState(null)
  const [showHistory, setShowHistory] = useState(null)

  const totalBalance = useMemo(
    () => bankAccounts.reduce((s, a) => s + (a.balance || 0), 0),
    [bankAccounts]
  )

  const positiveAccounts = bankAccounts.filter(a => a.balance >= 0)
  const negativeAccounts = bankAccounts.filter(a => a.balance < 0)

  // Pie data for distribution
  const pieData = useMemo(
    () => bankAccounts
      .filter(a => a.balance > 0)
      .map(a => ({ name: a.name, value: a.balance, color: a.color || '#7c5cfc' })),
    [bankAccounts]
  )

  const getHistory = (accountId) =>
    balanceHistory.filter(h => h.bankAccountId === accountId)

  const handleSave = (newBalance, id) => {
    updateBankBalance(id, newBalance)
    setEditingId(null)
  }

  return (
    <div className="page">
      <div className="page__header">
        <h2>Contas Bancárias</h2>
        <button className="btn btn--primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Adicionar conta
        </button>
      </div>

      {/* ── TOTAL SUMMARY ── */}
      <div className={styles.totalCard}>
        <div className={styles.totalLeft}>
          <p className={styles.totalLabel}>Patrimônio total em contas</p>
          <p className={styles.totalValue} style={{ color: totalBalance >= 0 ? '#0ecb81' : '#f03e3e' }}>
            {formatCurrency(totalBalance)}
          </p>
          <div className={styles.totalMeta}>
            <span>{bankAccounts.length} conta(s) cadastrada(s)</span>
            {negativeAccounts.length > 0 && (
              <span style={{ color: '#f03e3e' }}>
                · {negativeAccounts.length} conta(s) negativa(s)
              </span>
            )}
          </div>
        </div>

        {/* Distribution chart */}
        {pieData.length > 0 && (
          <div className={styles.totalRight}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie data={pieData} cx={60} cy={60} innerRadius={35} outerRadius={58}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => formatCurrency(v)}
                  contentStyle={{ background: '#13132a', border: '1px solid #1e1e3f', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── PER-ACCOUNT BALANCE BARS ── */}
      {bankAccounts.length > 0 && (
        <div className={styles.distributionBars}>
          <p className={styles.sectionTitle}>Distribuição por conta</p>
          {[...bankAccounts]
            .sort((a, b) => b.balance - a.balance)
            .map(acc => {
              const pct = totalBalance > 0 ? Math.max(0, (acc.balance / totalBalance) * 100) : 0
              return (
                <div key={acc.id} className={styles.distBar}>
                  <div className={styles.distBarLeft}>
                    <BankIcon bank={acc.bank} color={acc.color || '#7c5cfc'} size={28} />
                    <span className={styles.distBarName}>{acc.name}</span>
                  </div>
                  <div className={styles.distBarTrack}>
                    <div className={styles.distBarFill}
                      style={{ width: `${pct}%`, background: acc.color || '#7c5cfc' }} />
                  </div>
                  <span className={styles.distBarPct}>{pct.toFixed(1)}%</span>
                  <span className={styles.distBarVal} style={{ color: acc.balance >= 0 ? '#f0f0ff' : '#f03e3e' }}>
                    {formatCurrency(acc.balance)}
                  </span>
                </div>
              )
            })}
        </div>
      )}

      {/* ── ACCOUNT CARDS GRID ── */}
      <div className={styles.grid}>
        {bankAccounts.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="icon"><Building2 size={36} opacity={0.3} /></div>
            <p>Nenhuma conta bancária cadastrada.<br />Adicione suas contas para ver o saldo total.</p>
          </div>
        ) : bankAccounts.map(acc => {
          const history = getHistory(acc.id)
          const lastUpdate = history.length > 0
            ? formatDate([...history].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0].recordedAt)
            : null
          const prevBalance = history.length >= 2
            ? [...history].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[1]?.balance
            : null
          const diff = prevBalance !== null ? acc.balance - prevBalance : null
          const isEditing = editingId === acc.id
          const showingHistory = showHistory === acc.id

          return (
            <div key={acc.id} className={`${styles.accountCard} animate-in`}
              style={{ borderColor: `${acc.color || '#7c5cfc'}30` }}>

              {/* Card header */}
              <div className={styles.accHeader}>
                <BankIcon bank={acc.bank} color={acc.color || '#7c5cfc'} size={42} />
                <div className={styles.accInfo}>
                  <p className={styles.accName}>{acc.name}</p>
                  <p className={styles.accType}>
                    {BANK_ACCOUNT_OPTIONS.find(b => b.value === acc.bank)?.label || acc.bank}
                    {' · '}{acc.type}
                  </p>
                  {(acc.agency || acc.accountNum) && (
                    <p className={styles.accNum}>
                      {acc.agency ? `Ag: ${acc.agency}` : ''}
                      {acc.agency && acc.accountNum ? ' · ' : ''}
                      {acc.accountNum ? `Cc: ${acc.accountNum}` : ''}
                    </p>
                  )}
                </div>
                <button className="btn btn--icon btn--ghost" onClick={() => removeBankAccount(acc.id)}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Balance display */}
              <div className={styles.balanceSection}>
                <p className={styles.balanceLabel}>Saldo atual</p>
                {isEditing ? (
                  <BalanceEditor
                    account={acc}
                    onSave={(v) => handleSave(v, acc.id)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className={styles.balanceDisplay}>
                    <span className={styles.balanceValue}
                      style={{ color: acc.balance >= 0 ? '#0ecb81' : '#f03e3e' }}>
                      {formatCurrency(acc.balance)}
                    </span>
                    <button className={styles.editBtn} onClick={() => setEditingId(acc.id)}
                      title="Atualizar saldo">
                      <Pencil size={13} />
                    </button>
                  </div>
                )}

                {/* Variation vs last update */}
                {diff !== null && (
                  <div className={styles.diff}>
                    {diff >= 0
                      ? <TrendingUp size={12} color="#0ecb81" />
                      : <TrendingDown size={12} color="#f03e3e" />}
                    <span style={{ color: diff >= 0 ? '#0ecb81' : '#f03e3e' }}>
                      {diff >= 0 ? '+' : ''}{formatCurrency(diff)} desde última atualização
                    </span>
                  </div>
                )}
                {lastUpdate && (
                  <p className={styles.lastUpdate}>Atualizado em {lastUpdate}</p>
                )}
              </div>

              {acc.notes && (
                <p className={styles.accNotes}>{acc.notes}</p>
              )}

              {/* Toggle history */}
              <button className={styles.histBtn}
                onClick={() => setShowHistory(showingHistory ? null : acc.id)}>
                <History size={13} />
                {showingHistory ? 'Ocultar histórico' : 'Ver histórico de saldo'}
              </button>

              {showingHistory && (
                <div className={styles.histSection}>
                  <HistoryChart history={history} color={acc.color || '#7c5cfc'} />
                  {history.length > 0 && (
                    <div className={styles.histList}>
                      {[...history]
                        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
                        .slice(0, 6)
                        .map((h, i) => (
                          <div key={h.id} className={styles.histRow}>
                            <span className={styles.histDate}>{formatDate(h.recordedAt)}</span>
                            <span className={styles.histVal}
                              style={{ color: h.balance >= 0 ? '#0ecb81' : '#f03e3e' }}>
                              {formatCurrency(h.balance)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && (
        <AddBankModal
          onClose={() => setShowModal(false)}
          onSave={(data) => { addBankAccount(data); setShowModal(false) }}
        />
      )}
    </div>
  )
}
