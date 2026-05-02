import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './components/Auth/AuthPage'
import LoadingScreen from './components/Auth/LoadingScreen'
import Layout from './components/Shared/Layout'
import Dashboard from './components/Dashboard/Dashboard'
import Banks from './components/Banks/Banks'
import Transactions from './components/Transactions/Transactions'
import Bills from './components/Bills/Bills'
import Installments from './components/Installments/Installments'
import Cards from './components/Cards/Cards'
import Investments from './components/Investments/Investments'
import CashFlow from './components/CashFlow/CashFlow'
import RecurringIncomes from './components/RecurringIncomes/RecurringIncomes'
import Friends from './components/Friends/Friends'
import Receivables from './components/Receivables/Receivables'
import { useFinance } from './hooks/useFinance'
import './styles/global.scss'

function AppInner() {
  const f = useFinance()
  if (f.loading) return <LoadingScreen message="Carregando seus dados..." />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={
          <Dashboard
            bankAccounts={f.bankAccounts}
            cards={f.cards}
            transactions={f.transactions}
            bills={f.bills}
            installments={f.installments}
            investments={f.investments}
            receivables={f.receivables}
            recurringIncomes={f.recurringIncomes}
          />
        } />
        <Route path="/bancos" element={
          <Banks
            bankAccounts={f.bankAccounts}
            balanceHistory={f.balanceHistory}
            addBankAccount={f.addBankAccount}
            updateBankBalance={f.updateBankBalance}
            removeBankAccount={f.removeBankAccount}
          />
        } />
        <Route path="/lancamentos" element={
          <Transactions
            transactions={f.transactions}
            cards={f.cards}
            bankAccounts={f.bankAccounts}
            addTransaction={f.addTransaction}
            editTransaction={f.editTransaction}
            removeTransaction={f.removeTransaction}
          />
        } />
        <Route path="/contas" element={
          <Bills bills={f.bills} addBill={f.addBill}
            editBill={f.editBill}
            toggleBill={f.toggleBill} removeBill={f.removeBill} />
        } />
        <Route path="/parcelas" element={
          <Installments installments={f.installments} cards={f.cards}
            addInstallment={f.addInstallment} editInstallment={f.editInstallment}
            payInstallment={f.payInstallment} removeInstallment={f.removeInstallment} />
        } />
        <Route path="/cartoes" element={
          <Cards cards={f.cards} transactions={f.transactions} installments={f.installments}
            addCard={f.addCard} removeCard={f.removeCard} />
        } />
        <Route path="/investimentos" element={
          <Investments investments={f.investments}
            addInvestment={f.addInvestment} editInvestment={f.editInvestment}
            removeInvestment={f.removeInvestment} />
        } />
        <Route path="/a-receber" element={
          <Receivables receivables={f.receivables}
            addReceivable={f.addReceivable} removeReceivable={f.removeReceivable}
            markInstallmentPaid={f.markInstallmentPaid} markPersonPaid={f.markPersonPaid}
            addPersonToSplit={f.addPersonToSplit} />
        } />
        <Route path="/fluxo" element={
          <CashFlow
            transactions={f.transactions}
            bills={f.bills}
            installments={f.installments}
            receivables={f.receivables}
            recurringIncomes={f.recurringIncomes}
          />
        } />
        <Route path="/receitas-fixas" element={
          <RecurringIncomes
            recurringIncomes={f.recurringIncomes}
            addRecurringIncome={f.addRecurringIncome}
            editRecurringIncome={f.editRecurringIncome}
            toggleRecurringIncome={f.toggleRecurringIncome}
            removeRecurringIncome={f.removeRecurringIncome}
          />
        } />
        <Route path="/amigos" element={<Friends />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen message="Verificando sessão..." />
  return (
    <BrowserRouter>
      {user ? <AppInner /> : <AuthPage />}
    </BrowserRouter>
  )
}