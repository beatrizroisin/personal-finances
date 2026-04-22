// ─── INITIAL SEED DATA ───────────────────────────────────────────────────────

export const SEED_CARDS = [
  { id: 'c1', name: 'Nubank', bank: 'nubank', limit: 8000, color: '#820ad1', lastFour: '4521' },
  { id: 'c2', name: 'Itaú Visa', bank: 'itau', limit: 5000, color: '#ec7000', lastFour: '9873' },
  { id: 'c3', name: 'Inter', bank: 'inter', limit: 3000, color: '#ff6600', lastFour: '2210' },
];

export const SEED_TRANSACTIONS = [
  { id: 't1', desc: 'Salário', amount: 7500, category: 'Renda', date: '2026-04-05', type: 'income', cardId: null },
  { id: 't2', desc: 'Supermercado Pão de Açúcar', amount: 420, category: 'Alimentação', date: '2026-04-08', type: 'expense', cardId: 'c1' },
  { id: 't3', desc: 'Netflix', amount: 55, category: 'Lazer', date: '2026-04-10', type: 'expense', cardId: 'c1' },
  { id: 't4', desc: 'Conta de Luz', amount: 210, category: 'Moradia', date: '2026-04-11', type: 'expense', cardId: null },
  { id: 't5', desc: 'Uber', amount: 38, category: 'Transporte', date: '2026-04-12', type: 'expense', cardId: 'c2' },
  { id: 't6', desc: 'Farmácia', amount: 95, category: 'Saúde', date: '2026-04-14', type: 'expense', cardId: 'c1' },
  { id: 't7', desc: 'Freelance design', amount: 1200, category: 'Renda', date: '2026-04-15', type: 'income', cardId: null },
  { id: 't8', desc: 'iFood', amount: 67, category: 'Alimentação', date: '2026-04-16', type: 'expense', cardId: 'c1' },
  { id: 't9', desc: 'Academia Smart Fit', amount: 89, category: 'Saúde', date: '2026-04-17', type: 'expense', cardId: 'c2' },
  { id: 't10', desc: 'Posto de Gasolina', amount: 180, category: 'Transporte', date: '2026-04-18', type: 'expense', cardId: 'c3' },
];

export const SEED_BILLS = [
  { id: 'b1', desc: 'Aluguel', amount: 2200, dueDay: 5, paid: false, category: 'Moradia', recurring: true },
  { id: 'b2', desc: 'Internet Vivo', amount: 130, dueDay: 10, paid: true, category: 'Moradia', recurring: true },
  { id: 'b3', desc: 'Academia', amount: 89, dueDay: 15, paid: false, category: 'Saúde', recurring: true },
  { id: 'b4', desc: 'Seguro Auto', amount: 320, dueDay: 20, paid: false, category: 'Transporte', recurring: true },
  { id: 'b5', desc: 'Plano de Saúde', amount: 580, dueDay: 25, paid: false, category: 'Saúde', recurring: true },
];

export const SEED_INSTALLMENTS = [
  { id: 'i1', desc: 'MacBook Pro 14"', monthly: 850, totalInstallments: 12, paid: 3, dueDay: 15, cardId: 'c1', startDate: '2026-01-15' },
  { id: 'i2', desc: 'iPhone 15 Pro', monthly: 350, totalInstallments: 24, paid: 6, dueDay: 15, cardId: 'c2', startDate: '2025-10-15' },
  { id: 'i3', desc: 'TV OLED LG 65"', monthly: 280, totalInstallments: 10, paid: 2, dueDay: 20, cardId: 'c1', startDate: '2026-02-20' },
];

export const SEED_INVESTMENTS = [
  { id: 'inv1', desc: 'Tesouro Direto IPCA+', amount: 5000, returnPct: 6.8, type: 'Renda Fixa', startDate: '2025-01-10', institution: 'Tesouro Nacional' },
  { id: 'inv2', desc: 'CDB Nubank 110% CDI', amount: 8000, returnPct: 11.2, type: 'Renda Fixa', startDate: '2025-06-01', institution: 'Nubank' },
  { id: 'inv3', desc: 'Ações PETR4', amount: 2500, returnPct: 14.5, type: 'Renda Variável', startDate: '2025-09-15', institution: 'XP Investimentos' },
  { id: 'inv4', desc: 'Fundo Imobiliário XPML11', amount: 3200, returnPct: 9.3, type: 'FII', startDate: '2026-01-05', institution: 'XP Investimentos' },
];

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Renda', 'Outros'];

export const CATEGORY_COLORS = {
  'Alimentação':  '#ff922b',
  'Moradia':      '#7c5cfc',
  'Transporte':   '#4dabf7',
  'Saúde':        '#0ecb81',
  'Lazer':        '#f06595',
  'Educação':     '#ffd43b',
  'Renda':        '#20c997',
  'Outros':       '#868e96',
};

export const BANK_OPTIONS = [
  { value: 'nubank', label: 'Nubank', color: '#820ad1' },
  { value: 'itau', label: 'Itaú', color: '#ec7000' },
  { value: 'bradesco', label: 'Bradesco', color: '#cc0000' },
  { value: 'inter', label: 'Inter', color: '#ff6600' },
  { value: 'xp', label: 'XP', color: '#111111' },
  { value: 'c6', label: 'C6 Bank', color: '#2c2c2c' },
  { value: 'sicoob', label: 'Sicoob', color: '#008542' },
  { value: 'outro', label: 'Outro', color: '#7c5cfc' },
];

export const INVESTMENT_TYPES = ['Renda Fixa', 'Renda Variável', 'FII', 'Criptomoedas', 'Previdência', 'Outros'];

// ─── RECEIVABLES SEED DATA ────────────────────────────────────────────────────
// type: 'installment' = venda parcelada a UMA pessoa
//       'split'       = uma conta dividida entre VÁRIAS pessoas
export const SEED_RECEIVABLES = [
  {
    id: 'rec1',
    type: 'installment',
    desc: 'Venda do notebook antigo',
    totalAmount: 1500,
    installments: [
      { id: 'ri1', dueDate: '2026-04-25', amount: 500, paid: true,  paidDate: '2026-04-24' },
      { id: 'ri2', dueDate: '2026-05-25', amount: 500, paid: false, paidDate: null },
      { id: 'ri3', dueDate: '2026-06-25', amount: 500, paid: false, paidDate: null },
    ],
    person: { name: 'Carlos Souza', phone: '(11) 99999-0001', pix: 'carlos@email.com' },
    notes: 'Notebook Dell Inspiron 15',
    createdAt: '2026-03-25',
  },
  {
    id: 'rec2',
    type: 'split',
    desc: 'Churrasco de aniversário',
    totalAmount: 780,
    people: [
      { id: 'sp1', name: 'Ana Lima',      amount: 130, dueDate: '2026-04-28', paid: true,  paidDate: '2026-04-26', phone: '(11) 98888-1111', pix: 'ana@pix.com' },
      { id: 'sp2', name: 'Bruno Costa',   amount: 130, dueDate: '2026-04-28', paid: false, paidDate: null,         phone: '(11) 97777-2222', pix: '111.222.333-44' },
      { id: 'sp3', name: 'Carol Mendes',  amount: 130, dueDate: '2026-04-28', paid: true,  paidDate: '2026-04-27', phone: '(11) 96666-3333', pix: 'carol@email.com' },
      { id: 'sp4', name: 'Diego Alves',   amount: 130, dueDate: '2026-05-05', paid: false, paidDate: null,         phone: '(11) 95555-4444', pix: null },
      { id: 'sp5', name: 'Elisa Torres',  amount: 130, dueDate: '2026-05-05', paid: false, paidDate: null,         phone: '(11) 94444-5555', pix: 'elisa@pix.com' },
      { id: 'sp6', name: 'Felipe Ramos',  amount: 130, dueDate: '2026-05-05', paid: false, paidDate: null,         phone: null,              pix: null },
    ],
    notes: 'Festinha no sítio, 6 pessoas dividiram igual',
    createdAt: '2026-04-20',
  },
  {
    id: 'rec3',
    type: 'installment',
    desc: 'Empréstimo para irmão',
    totalAmount: 800,
    installments: [
      { id: 'ri4', dueDate: '2026-05-01', amount: 400, paid: false, paidDate: null },
      { id: 'ri5', dueDate: '2026-06-01', amount: 400, paid: false, paidDate: null },
    ],
    person: { name: 'Lucas Oliveira', phone: '(11) 93333-6666', pix: '999.888.777-66' },
    notes: 'Ajuda para conserto do carro',
    createdAt: '2026-04-01',
  },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
const PREFIX = 'fp_';

export function loadData(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveData(key, data) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(data)); } catch {}
}

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────
export const formatCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const todayStr = () => new Date().toISOString().split('T')[0];
export const todayDay = () => new Date().getDate();

export const monthsBetween = (startDate) => {
  const start = new Date(startDate);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
};

export const calcInvestmentReturn = (amount, annualPct, startDate) => {
  const months = monthsBetween(startDate);
  const earned = amount * (Math.pow(1 + annualPct / 100 / 12, months) - 1);
  return { earned, current: amount + earned };
};

export const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const daysUntilDue = (dateStr) => {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  const now = new Date();
  due.setHours(0,0,0,0);
  now.setHours(0,0,0,0);
  return Math.round((due - now) / (1000 * 60 * 60 * 24));
};

export const dueDateStatus = (dateStr, paid) => {
  if (paid) return 'paid';
  const d = daysUntilDue(dateStr);
  if (d < 0)  return 'overdue';
  if (d <= 3) return 'urgent';
  return 'pending';
};

// ─── BANK ACCOUNTS (saldo real por banco) ────────────────────────────────────
// Diferente de "cards" (cartões de crédito), bank_accounts são contas correntes/
// poupança/digital com saldo manual informado pelo usuário.
export const BANK_ACCOUNT_TYPES = [
  'Conta Corrente',
  'Conta Poupança',
  'Conta Digital',
  'Conta Salário',
  'Conta Investimento',
]

export const BANK_LOGOS = {
  nubank:   '#820ad1',
  inter:    '#ff6600',
  itau:     '#ec7000',
  bradesco: '#cc0000',
  bb:       '#f7c82a',
  caixa:    '#0070af',
  santander:'#ec0000',
  xp:       '#000000',
  c6:       '#2c2c2c',
  sicoob:   '#008542',
  picpay:   '#11c76f',
  pagbank:  '#03a64a',
  neon:     '#00e5e5',
  outro:    '#7c5cfc',
}

export const BANK_ACCOUNT_OPTIONS = [
  { value: 'nubank',    label: 'Nubank',    color: '#820ad1' },
  { value: 'inter',     label: 'Inter',     color: '#ff6600' },
  { value: 'itau',      label: 'Itaú',      color: '#ec7000' },
  { value: 'bradesco',  label: 'Bradesco',  color: '#cc0000' },
  { value: 'bb',        label: 'Banco do Brasil', color: '#f7c82a' },
  { value: 'caixa',     label: 'Caixa',     color: '#0070af' },
  { value: 'santander', label: 'Santander', color: '#ec0000' },
  { value: 'xp',        label: 'XP Investimentos', color: '#000000' },
  { value: 'c6',        label: 'C6 Bank',   color: '#2c2c2c' },
  { value: 'sicoob',    label: 'Sicoob',    color: '#008542' },
  { value: 'picpay',    label: 'PicPay',    color: '#11c76f' },
  { value: 'pagbank',   label: 'PagBank',   color: '#03a64a' },
  { value: 'neon',      label: 'Neon',      color: '#00e5e5' },
  { value: 'outro',     label: 'Outro',     color: '#7c5cfc' },
]

// ─── MONTH RESET HELPERS ─────────────────────────────────────────────────────
// Returns "YYYY-MM" of the current month
export const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Given bills array, resets recurring ones if we've entered a new month
// Returns { bills: updatedBills, resetIds: string[] } — resetIds go to DB
export const resetRecurringIfNewMonth = (bills, lastResetMonth) => {
  const thisMonth = currentMonthKey();
  if (lastResetMonth === thisMonth) return { bills, resetIds: [] };
  const resetIds = [];
  const updated = bills.map(b => {
    if (b.recurring && b.paid) {
      resetIds.push(b.id);
      return { ...b, paid: false };
    }
    return b;
  });
  return { bills: updated, resetIds };
};

// ─── CASHFLOW HELPERS ─────────────────────────────────────────────────────────
// Returns an array of { year, month, label } for N months starting from offset
// offset 0 = current month, -2 = 2 months ago, 3 = 3 months ahead
export const getMonthRange = (count = 13, startOffset = -2) => {
  const now = new Date();
  const result = [];
  for (let i = startOffset; i < startOffset + count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    result.push({
      year:  d.getFullYear(),
      month: d.getMonth() + 1,       // 1-12
      key:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
         .replace('.', '').replace(' ', ''),
      longLabel: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    });
  }
  return result;
};

// Build cashflow for a specific { year, month }
// Returns { income, expenses, installments, bills, balance }
export const buildMonthCashflow = ({ year, month }, transactions, bills, installments) => {
  const pad = n => String(n).padStart(2, '0');
  const prefix = `${year}-${pad(month)}`;

  // Real transactions for that month
  const monthTx = transactions.filter(t => t.date?.startsWith(prefix));
  const txIncome   = monthTx.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
  const txExpenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Recurring bills projected for that month (always show, paid status is current-month only)
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const projectedBills = bills
    .filter(b => b.recurring)
    .map(b => ({
      id: b.id, desc: b.desc, amount: b.amount, dueDay: b.dueDay,
      category: b.category,
      // paid only meaningful for the current month
      paid: isCurrentMonth ? b.paid : false,
      dueDate: `${year}-${pad(month)}-${pad(b.dueDay)}`,
    }));
  const billsTotal = projectedBills.reduce((s, b) => s + b.amount, 0);

  // Active installments for that month
  const targetDate = new Date(year, month - 1, 1);
  const projectedInstallments = installments
    .filter(inst => {
      if (inst.paid >= inst.totalInstallments) return false;
      const start = new Date(inst.startDate || '2020-01-01');
      start.setDate(1);
      const endMonth = new Date(start.getFullYear(), start.getMonth() + inst.totalInstallments - 1, 1);
      return targetDate >= start && targetDate <= endMonth;
    })
    .map(inst => ({
      id: inst.id, desc: inst.desc, amount: inst.monthly,
      dueDay: inst.dueDay, cardId: inst.cardId,
      dueDate: `${year}-${pad(month)}-${pad(inst.dueDay)}`,
    }));
  const installmentsTotal = projectedInstallments.reduce((s, i) => s + i.amount, 0);

  const totalExpenses = txExpenses + billsTotal + installmentsTotal;
  const balance       = txIncome - totalExpenses;

  return {
    txIncome, txExpenses, txIncomeTx: monthTx.filter(t => t.type === 'income'),
    txExpenseTx: monthTx.filter(t => t.type === 'expense'),
    bills: projectedBills, billsTotal,
    installments: projectedInstallments, installmentsTotal,
    totalExpenses, balance,
  };
};
