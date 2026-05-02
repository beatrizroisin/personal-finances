import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, AlertCircle, AlertTriangle, CreditCard, Coins, Building
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import StatCard from '../Shared/StatCard';
import { formatCurrency, formatDate, CATEGORY_COLORS, todayDay, calcInvestmentReturn, dueDateStatus, buildMonthCashflow } from '../../data/store';
import styles from './Dashboard.module.scss';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard({ bankAccounts = [], cards, transactions, bills, installments, investments, receivables = [], recurringIncomes = [] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const day = todayDay();
  const [sharedDebts, setSharedDebts] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('shared_debts').select('*')
      .eq('debtor_id', user.id).eq('paid', false)
      .then(({ data }) => setSharedDebts(data || []));
  }, [user]);

  const totalOwed = sharedDebts.reduce((s, d) => s + (d.amount || 0), 0);

  const totalBankBalance = useMemo(() => bankAccounts.reduce((s, a) => s + (a.balance || 0), 0), [bankAccounts])
  const totalIncome    = useMemo(() => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense   = useMemo(() => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [transactions]);
  const balance        = totalIncome - totalExpense;
  const totalInvested  = useMemo(() => investments.reduce((s, i) => s + i.amount, 0), [investments]);
  const totalReturn    = useMemo(() =>
    investments.reduce((s, i) => s + calcInvestmentReturn(i.amount, i.returnPct, i.startDate).earned, 0),
    [investments]
  );
  const pendingBills   = useMemo(() => bills.filter(b => !b.paid), [bills]);
  const pendingAmount  = pendingBills.reduce((s, b) => s + b.amount, 0);
  const installMonthly = useMemo(() => installments.reduce((s, i) => s + i.monthly, 0), [installments]);

  // ── Saldo previsto do mês (mesmo cálculo do Fluxo de Caixa) ─────────────────
  const monthProjection = useMemo(() => {
    const now = new Date();
    const meta = { year: now.getFullYear(), month: now.getMonth() + 1 };
    return buildMonthCashflow(meta, transactions, bills, installments, receivables, recurringIncomes);
  }, [transactions, bills, installments, receivables, recurringIncomes]);

  // Receivables summary
  const recStats = useMemo(() => {
    let totalToReceive = 0, overdueItems = [];
    receivables.forEach(r => {
      if (r.type === 'installment') {
        r.installments.forEach(inst => {
          if (!inst.paid) {
            totalToReceive += inst.amount;
            if (dueDateStatus(inst.dueDate, false) === 'overdue') {
              overdueItems.push({ desc: r.desc, person: r.person?.name, amount: inst.amount, date: inst.dueDate });
            }
          }
        });
      } else {
        r.people.forEach(p => {
          if (!p.paid) {
            totalToReceive += p.amount;
            if (dueDateStatus(p.dueDate, false) === 'overdue') {
              overdueItems.push({ desc: r.desc, person: p.name, amount: p.amount, date: p.dueDate });
            }
          }
        });
      }
    });
    return { totalToReceive, overdueItems };
  }, [receivables]);

  // Alerts: bills due within 3 days
  const urgent = pendingBills.filter(b => b.dueDay >= day && b.dueDay <= day + 3);
  const overdue = pendingBills.filter(b => b.dueDay < day);

  // Category pie data
  const catData = useMemo(() => {
    const acc = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
    });
    return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Monthly data — last 6 months from real transactions (dynamic, no mock)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${y}-${m}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const isCurrentMonth = i === 0;

      const monthTx = transactions.filter(t => {
        // Use billingMonth if available (credit card), else use date
        const key = t.billingMonth || t.date?.slice(0, 7);
        return key === prefix;
      });

      const receita = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const gasto   = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      result.push({ mes: label, receita, gasto, isCurrent: isCurrentMonth });
    }
    return result;
  }, [transactions]);

  // Card usage breakdown
  const cardUsage = useMemo(() => {
    const acc = {};
    transactions.filter(t => t.type === 'expense' && t.cardId).forEach(t => {
      const card = cards.find(c => c.id === t.cardId);
      if (card) {
        if (!acc[card.id]) acc[card.id] = { name: card.name, value: 0, color: card.color };
        acc[card.id].value += t.amount;
      }
    });
    return Object.values(acc).sort((a, b) => b.value - a.value);
  }, [transactions, cards]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Visão Geral</h1>
          <p className={styles.sub}>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className={styles.balanceChipWrap}>
          <div className={styles.balanceChip}
            style={{ borderColor: monthProjection.balance >= 0 ? 'rgba(14,203,129,0.4)' : 'rgba(240,62,62,0.4)' }}>
            <span className={styles.balanceLabel}>Saldo previsto do mês</span>
            <span className={styles.balanceValue}
              style={{ color: monthProjection.balance >= 0 ? '#0ecb81' : '#f03e3e' }}>
              {formatCurrency(monthProjection.balance)}
            </span>
            <span className={styles.balanceSub}>
              +{formatCurrency(monthProjection.totalIncome)} − {formatCurrency(monthProjection.totalExpenses)}
            </span>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {(urgent.length > 0 || overdue.length > 0 || recStats.overdueItems.length > 0) && (
        <div className={styles.alerts}>
          {overdue.length > 0 && (
            <div className={`${styles.alert} ${styles.alertRed}`}>
              <AlertCircle size={16} />
              <span>{overdue.length} conta(s) em atraso — {formatCurrency(overdue.reduce((s,b)=>s+b.amount,0))}</span>
            </div>
          )}
          {urgent.map(b => (
            <div key={b.id} className={`${styles.alert} ${styles.alertOrange}`}>
              <AlertCircle size={16} />
              <span><b>{b.desc}</b> vence dia {b.dueDay} — {formatCurrency(b.amount)}</span>
            </div>
          ))}
          {recStats.overdueItems.slice(0, 3).map((item, i) => (
            <div key={i} className={`${styles.alert} ${styles.alertGreen}`}
              style={{ cursor: 'pointer' }} onClick={() => navigate('/a-receber')}>
              <Coins size={16} />
              <span>A receber: <b>{item.desc}</b> de {item.person} — {formatCurrency(item.amount)} atrasado</span>
            </div>
          ))}
        </div>
      )}

      {/* Saldo previsto destacado */}
      <div className={styles.projectionBanner}
        style={{ borderColor: monthProjection.balance >= 0 ? 'rgba(14,203,129,0.3)' : 'rgba(240,62,62,0.3)' }}
        onClick={() => navigate('/fluxo')} title="Ver Fluxo de Caixa">
        <div className={styles.projectionLeft}>
          <p className={styles.projectionLabel}>Saldo previsto de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
          <p className={styles.projectionValue}
            style={{ color: monthProjection.balance >= 0 ? '#0ecb81' : '#f03e3e' }}>
            {formatCurrency(monthProjection.balance)}
          </p>
          <p className={styles.projectionFormula}>
            Receitas {formatCurrency(monthProjection.totalIncome)}
            {' '}· Contas {formatCurrency(monthProjection.billsTotal)}
            {' '}· Parcelas {formatCurrency(monthProjection.installmentsTotal)}
            {' '}· Gastos {formatCurrency(monthProjection.txExpenses)}
          </p>
        </div>
        <span className={styles.projectionLink}>Ver fluxo completo →</span>
      </div>

      {/* Stat cards */}
      <div className={styles.statGrid}>
        <StatCard label="Saldo em Bancos" value={formatCurrency(totalBankBalance)} icon={Building} color="green"
          sub={bankAccounts.length + ' conta(s) cadastrada(s)'} />
        <StatCard label="Receitas" value={formatCurrency(totalIncome)} icon={TrendingUp} color="green" />
        <StatCard label="Gastos" value={formatCurrency(totalExpense)} icon={TrendingDown} color="red" />
        <StatCard label="A Pagar" value={formatCurrency(pendingAmount)} icon={AlertCircle} color="orange"
          sub={`${pendingBills.length} conta(s) pendente(s)`} />
        <StatCard label="A Receber" value={formatCurrency(recStats.totalToReceive)} icon={Coins} color="green"
          sub={`${receivables.length} cobrança(s)`} />
        {totalOwed > 0 && (
          <StatCard label="Devo a amigos" value={formatCurrency(totalOwed)} icon={AlertTriangle} color="red"
            sub={`${sharedDebts.length} dívida(s) pendente(s)`} />
        )}
        <StatCard label="Parcelas/mês" value={formatCurrency(installMonthly)} icon={CreditCard} color="accent" />
        <StatCard label="Investido" value={formatCurrency(totalInvested)} icon={Wallet} color="blue"
          sub={`+${formatCurrency(totalReturn)} rendimento est.`} />
      </div>

      {/* Charts row */}
      <div className={styles.chartsRow}>
        {/* Category pie */}
        <div className={`card ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>Gastos por categoria</h3>
          {catData.length > 0 ? (
            <div className={styles.pieWrap}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={catData} cx={75} cy={75} innerRadius={45} outerRadius={72}
                    dataKey="value" paddingAngle={3}>
                    {catData.map(e => <Cell key={e.name} fill={CATEGORY_COLORS[e.name] || '#868e96'} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)}
                    contentStyle={{ background: '#13132a', border: '1px solid #1e1e3f', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.legend}>
                {catData.map(c => (
                  <div key={c.name} className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: CATEGORY_COLORS[c.name] || '#868e96' }} />
                    <span className={styles.legendName}>{c.name}</span>
                    <span className={styles.legendVal}>{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state"><p>Nenhum gasto registrado</p></div>
          )}
        </div>

        {/* Monthly bar */}
        <div className={`card ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>Histórico mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3f" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#55557a', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#55557a', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={v => <span style={{ color: '#8888bb', fontSize: 12 }}>{v === 'receita' ? 'Receita' : 'Gasto'}</span>}
              />
              <Bar dataKey="receita" name="receita" fill="#0ecb81" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gasto" name="gasto" fill="#7c5cfc" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Card usage */}
      {cardUsage.length > 0 && (
        <div className={`card ${styles.cardUsageBox}`}>
          <h3 className={styles.chartTitle}>Uso por cartão</h3>
          <div className={styles.cardUsageGrid}>
            {cardUsage.map((c) => {
              const pct = (c.value / totalExpense * 100).toFixed(1);
              return (
                <div key={c.name} className={styles.cardUsageItem}>
                  <div className={styles.cardUsageHeader}>
                    <div className={styles.cardUsageDot} style={{ background: c.color }} />
                    <span className={styles.cardUsageName}>{c.name}</span>
                    <span className={styles.cardUsagePct}>{pct}%</span>
                    <span className={styles.cardUsageVal}>{formatCurrency(c.value)}</span>
                  </div>
                  <div className="progress">
                    <div className="progress__fill" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.cardUsageChart}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cardUsage} layout="vertical">
                <XAxis type="number" tick={{ fill: '#55557a', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#8888bb', fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={v => formatCurrency(v)}
                  contentStyle={{ background: '#13132a', border: '1px solid #1e1e3f', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {cardUsage.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* A Receber summary widget */}
      {/* Bank accounts mini-widget */}
      {bankAccounts.length > 0 && (
        <div className={`card ${styles.banksSummaryBox}`} onClick={() => navigate('/bancos')}
          style={{ cursor: 'pointer' }}>
          <div className={styles.recSummaryHeader}>
            <h3 className={styles.chartTitle} style={{ marginBottom: 0 }}>Contas Bancárias</h3>
            <span className={styles.recSummaryLink}>Ver tudo →</span>
          </div>
          <div className={styles.banksSummaryGrid}>
            {[...bankAccounts].sort((a, b) => b.balance - a.balance).slice(0, 4).map(acc => (
              <div key={acc.id} className={styles.banksSummaryItem}
                style={{ borderColor: `${acc.color || '#7c5cfc'}30` }}>
                <div className={styles.banksSummaryDot} style={{ background: acc.color || '#7c5cfc' }} />
                <div className={styles.recSummaryInfo}>
                  <p className={styles.recSummaryDesc}>{acc.name}</p>
                  <p className={styles.recSummaryMeta}>{acc.type}</p>
                </div>
                <span className={styles.recSummaryAmt}
                  style={{ color: acc.balance >= 0 ? '#0ecb81' : '#f03e3e' }}>
                  {formatCurrency(acc.balance)}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.banksTotalRow}>
            <span style={{ color: '#8888bb', fontSize: 13 }}>Total em contas</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: totalBankBalance >= 0 ? '#0ecb81' : '#f03e3e' }}>
              {formatCurrency(totalBankBalance)}
            </span>
          </div>
        </div>
      )}

      {receivables.length > 0 && (
        <div className={`card ${styles.recSummaryBox}`} onClick={() => navigate('/a-receber')}
          style={{ cursor: 'pointer' }}>
          <div className={styles.recSummaryHeader}>
            <h3 className={styles.chartTitle} style={{ marginBottom: 0 }}>A Receber</h3>
            <span className={styles.recSummaryLink}>Ver tudo →</span>
          </div>
          <div className={styles.recSummaryGrid}>
            {receivables.slice(0, 4).map(r => {
              const pending = r.type === 'installment'
                ? r.installments.filter(i => !i.paid).reduce((s, i) => s + i.amount, 0)
                : r.people.filter(p => !p.paid).reduce((s, p) => s + p.amount, 0);
              const total = r.type === 'installment'
                ? r.installments.length
                : r.people.length;
              const paidCount = r.type === 'installment'
                ? r.installments.filter(i => i.paid).length
                : r.people.filter(p => p.paid).length;
              const allDone = pending === 0;
              return (
                <div key={r.id} className={styles.recSummaryItem}
                  style={{ borderColor: allDone ? 'rgba(14,203,129,0.25)' : 'rgba(255,146,43,0.2)' }}>
                  <div className={styles.recSummaryIcon}>
                    {r.type === 'installment' ? '👤' : '👥'}
                  </div>
                  <div className={styles.recSummaryInfo}>
                    <p className={styles.recSummaryDesc}>{r.desc}</p>
                    <p className={styles.recSummaryMeta}>
                      {r.type === 'installment' ? r.person?.name : `${total} pessoas`}
                      {' · '}{paidCount}/{total} {r.type === 'installment' ? 'parcelas' : 'pagamentos'}
                    </p>
                  </div>
                  <span className={styles.recSummaryAmt} style={{ color: allDone ? '#0ecb81' : '#ff922b' }}>
                    {allDone ? '✓ Quitado' : formatCurrency(pending)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}