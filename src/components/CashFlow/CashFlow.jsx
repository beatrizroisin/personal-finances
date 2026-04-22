import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Repeat2, CreditCard, ArrowLeftRight, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { formatCurrency, formatDate, getMonthRange, buildMonthCashflow, CATEGORY_COLORS } from '../../data/store'
import styles from './CashFlow.module.scss'

// ─── TOOLTIP ────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, fontSize: 12 }}>
          {p.name === 'receita' ? 'Receita' : p.name === 'gasto' ? 'Gasto' : 'Saldo'}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, color, total, count }) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionIconWrap} style={{ background: `${color}18` }}>
        <Icon size={16} color={color} />
      </div>
      <h4 className={styles.sectionTitle}>{title}</h4>
      {count > 0 && <span className={styles.sectionCount}>{count}</span>}
      <span className={styles.sectionTotal} style={{ color }}>{formatCurrency(total)}</span>
    </div>
  )
}

// ─── ITEM ROW ────────────────────────────────────────────────────────────────
function ItemRow({ desc, amount, sub, paid, color, dueDate }) {
  return (
    <div className={`${styles.itemRow} ${paid ? styles.itemRowPaid : ''}`}>
      <div className={styles.itemInfo}>
        <p className={styles.itemDesc} style={{ textDecoration: paid ? 'line-through' : 'none' }}>
          {desc}
        </p>
        {(sub || dueDate) && (
          <p className={styles.itemSub}>
            {sub && <span>{sub}</span>}
            {dueDate && <span>Vence {formatDate(dueDate)}</span>}
          </p>
        )}
      </div>
      {paid && (
        <span className={styles.paidTag}>
          <Check size={10} /> Pago
        </span>
      )}
      <span className={styles.itemAmount} style={{ color: paid ? '#55557a' : color }}>
        {formatCurrency(amount)}
      </span>
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function CashFlow({ transactions, bills, installments }) {
  const now           = new Date()
  const currentYear   = now.getFullYear()
  const currentMonth  = now.getMonth() + 1

  const [selectedKey, setSelectedKey] = useState(`${currentYear}-${String(currentMonth).padStart(2,'0')}`)
  const [chartOffset, setChartOffset] = useState(0)

  // 13 months range for the chart (6 back, current, 6 ahead)
  const allMonths = useMemo(() => getMonthRange(13, -6), [])

  // Build cashflow for each month in the chart range
  const chartData = useMemo(
    () => allMonths.map(m => {
      const cf = buildMonthCashflow(m, transactions, bills, installments)
      return {
        key: m.key, label: m.label, longLabel: m.longLabel,
        receita: cf.txIncome,
        gasto:   cf.totalExpenses,
        saldo:   cf.balance,
      }
    }),
    [allMonths, transactions, bills, installments]
  )

  // Visible window: 6 months at a time
  const visibleChart = chartData.slice(chartOffset, chartOffset + 6)
  const canBack  = chartOffset > 0
  const canFwd   = chartOffset + 6 < chartData.length

  // Selected month cashflow
  const selectedMeta = allMonths.find(m => m.key === selectedKey)
  const cf = useMemo(
    () => selectedMeta ? buildMonthCashflow(selectedMeta, transactions, bills, installments) : null,
    [selectedMeta, transactions, bills, installments]
  )

  if (!cf) return null

  const isCurrentMonth = selectedKey === `${currentYear}-${String(currentMonth).padStart(2,'0')}`

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Fluxo de Caixa</h2>
          <p className={styles.pageSubtitle}>Visão mês a mês de receitas, contas e parcelas</p>
        </div>
      </div>

      {/* ── OVERVIEW CHART ── */}
      <div className={`card ${styles.chartCard}`}>
        <div className={styles.chartNav}>
          <button className={styles.navBtn} onClick={() => setChartOffset(o => o - 1)} disabled={!canBack}>
            <ChevronLeft size={16} />
          </button>
          <h3 className={styles.chartTitle}>Visão geral — 6 meses</h3>
          <button className={styles.navBtn} onClick={() => setChartOffset(o => o + 1)} disabled={!canFwd}>
            <ChevronRight size={16} />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={visibleChart} barCategoryGap="20%"
            onClick={d => d?.activePayload && setSelectedKey(d.activePayload[0]?.payload?.key)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#55557a', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#55557a', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(124,92,252,0.06)' }} />
            <Bar dataKey="receita" name="receita" fill="#0ecb81" radius={[4,4,0,0]}>
              {visibleChart.map(d => (
                <Cell key={d.key} fill={d.key === selectedKey ? '#0ecb81' : '#0ecb8166'} />
              ))}
            </Bar>
            <Bar dataKey="gasto" name="gasto" fill="#7c5cfc" radius={[4,4,0,0]}>
              {visibleChart.map(d => (
                <Cell key={d.key} fill={d.key === selectedKey ? '#7c5cfc' : '#7c5cfc66'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Month pills */}
        <div className={styles.monthPills}>
          {visibleChart.map(m => (
            <button key={m.key}
              className={`${styles.pill} ${m.key === selectedKey ? styles.pillActive : ''} ${m.key === `${currentYear}-${String(currentMonth).padStart(2,'0')}` ? styles.pillCurrent : ''}`}
              onClick={() => setSelectedKey(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SELECTED MONTH DETAIL ── */}
      <div className={styles.detailHeader}>
        <h3 className={styles.detailTitle}>
          {selectedMeta?.longLabel}
          {isCurrentMonth && <span className={styles.currentTag}>mês atual</span>}
        </h3>
      </div>

      {/* Summary row */}
      <div className={styles.summaryRow}>
        {[
          { label: 'Receitas',   value: cf.txIncome,         color: '#0ecb81', icon: TrendingUp },
          { label: 'Gastos tx.', value: cf.txExpenses,       color: '#f03e3e', icon: TrendingDown },
          { label: 'Contas',     value: cf.billsTotal,       color: '#ff922b', icon: Repeat2 },
          { label: 'Parcelas',   value: cf.installmentsTotal,color: '#7c5cfc', icon: CreditCard },
          { label: 'Saldo prev.',value: cf.balance,          color: cf.balance >= 0 ? '#0ecb81' : '#f03e3e', icon: ArrowLeftRight, bold: true },
        ].map(s => (
          <div key={s.label} className={`${styles.summaryCard} ${s.bold ? styles.summaryCardBold : ''}`}
            style={s.bold ? { borderColor: s.color + '40' } : {}}>
            <div className={styles.summaryIcon} style={{ background: `${s.color}18` }}>
              <s.icon size={14} color={s.color} />
            </div>
            <p className={styles.summaryLabel}>{s.label}</p>
            <p className={styles.summaryValue} style={{ color: s.color }}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Detail columns */}
      <div className={styles.detailGrid}>

        {/* LEFT: Bills + Installments */}
        <div className={styles.detailCol}>

          {/* Recurring bills */}
          <div className={`card ${styles.detailCard}`}>
            <SectionHeader icon={Repeat2} title="Contas Recorrentes"
              color="#ff922b" total={cf.billsTotal} count={cf.bills.length} />
            {cf.bills.length === 0 ? (
              <p className={styles.emptyMsg}>Nenhuma conta recorrente cadastrada</p>
            ) : (
              <div className={styles.itemList}>
                {[...cf.bills].sort((a, b) => a.dueDay - b.dueDay).map(b => (
                  <ItemRow key={b.id} desc={b.desc} amount={b.amount}
                    sub={b.category} dueDate={b.dueDate}
                    paid={isCurrentMonth ? b.paid : false}
                    color="#ff922b" />
                ))}
              </div>
            )}
            {cf.bills.length > 0 && (
              <div className={styles.sectionFooter}>
                <span>{cf.bills.filter(b => b.paid).length}/{cf.bills.length} pagas</span>
                <span style={{ color: '#ff922b', fontWeight: 700 }}>{formatCurrency(cf.billsTotal)}</span>
              </div>
            )}
          </div>

          {/* Installments */}
          {cf.installments.length > 0 && (
            <div className={`card ${styles.detailCard}`}>
              <SectionHeader icon={CreditCard} title="Parcelas"
                color="#7c5cfc" total={cf.installmentsTotal} count={cf.installments.length} />
              <div className={styles.itemList}>
                {[...cf.installments].sort((a, b) => a.dueDay - b.dueDay).map(i => (
                  <ItemRow key={i.id} desc={i.desc} amount={i.monthly}
                    sub={i.cardId ? `Cartão` : undefined} dueDate={i.dueDate}
                    paid={false} color="#7c5cfc" />
                ))}
              </div>
              <div className={styles.sectionFooter}>
                <span>{cf.installments.length} parcela(s) ativa(s)</span>
                <span style={{ color: '#7c5cfc', fontWeight: 700 }}>{formatCurrency(cf.installmentsTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Transactions */}
        <div className={styles.detailCol}>

          {/* Income */}
          {cf.txIncomeTx.length > 0 && (
            <div className={`card ${styles.detailCard}`}>
              <SectionHeader icon={TrendingUp} title="Receitas lançadas"
                color="#0ecb81" total={cf.txIncome} count={cf.txIncomeTx.length} />
              <div className={styles.itemList}>
                {[...cf.txIncomeTx].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                  <ItemRow key={t.id} desc={t.desc} amount={t.amount}
                    sub={t.category} dueDate={t.date}
                    paid={false} color="#0ecb81" />
                ))}
              </div>
            </div>
          )}

          {/* Expenses */}
          {cf.txExpenseTx.length > 0 && (
            <div className={`card ${styles.detailCard}`}>
              <SectionHeader icon={TrendingDown} title="Gastos lançados"
                color="#f03e3e" total={cf.txExpenses} count={cf.txExpenseTx.length} />
              <div className={styles.itemList}>
                {[...cf.txExpenseTx].sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                  <ItemRow key={t.id} desc={t.desc} amount={t.amount}
                    sub={t.category} dueDate={t.date}
                    paid={false} color="#f03e3e" />
                ))}
              </div>
            </div>
          )}

          {/* Empty state for future months */}
          {cf.txIncomeTx.length === 0 && cf.txExpenseTx.length === 0 && (
            <div className={`card ${styles.detailCard}`}>
              <div className={styles.emptyFuture}>
                <ArrowLeftRight size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                <p className={styles.emptyFutureTitle}>
                  {selectedKey > `${currentYear}-${String(currentMonth).padStart(2,'0')}`
                    ? 'Mês futuro — sem lançamentos ainda'
                    : 'Nenhum lançamento neste mês'}
                </p>
                <p className={styles.emptyFutureDesc}>
                  Apenas contas recorrentes e parcelas são projetadas automaticamente
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Balance explanation */}
      <div className={`card ${styles.balanceExplain}`}
        style={{ borderColor: cf.balance >= 0 ? 'rgba(14,203,129,0.25)' : 'rgba(240,62,62,0.25)' }}>
        <div className={styles.balanceExplainLeft}>
          <p className={styles.balanceExplainLabel}>Como o saldo previsto é calculado</p>
          <p className={styles.balanceExplainFormula}>
            Receitas ({formatCurrency(cf.txIncome)}) − Gastos ({formatCurrency(cf.txExpenses)}) − Contas ({formatCurrency(cf.billsTotal)}) − Parcelas ({formatCurrency(cf.installmentsTotal)})
          </p>
        </div>
        <div className={styles.balanceExplainRight}>
          <p style={{ fontSize: 11, color: '#55557a', marginBottom: 4 }}>Saldo previsto</p>
          <p style={{ fontSize: 28, fontWeight: 700, color: cf.balance >= 0 ? '#0ecb81' : '#f03e3e' }}>
            {formatCurrency(cf.balance)}
          </p>
        </div>
      </div>
    </div>
  )
}
