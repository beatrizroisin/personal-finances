import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, BellRing,
  CreditCard, TrendingUp, Wallet, HandCoins,
  Building2, CalendarDays, Menu, X, LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../lib/supabase'
import styles from './Layout.module.scss'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Visão Geral' },
  { to: '/bancos',        icon: Building2,       label: 'Bancos' },
  { to: '/fluxo',         icon: CalendarDays,    label: 'Fluxo de Caixa' },
  { to: '/lancamentos',   icon: ArrowLeftRight,  label: 'Lançamentos' },
  { to: '/contas',        icon: BellRing,        label: 'Contas a Pagar' },
  { to: '/parcelas',      icon: CreditCard,      label: 'Parcelas' },
  { to: '/cartoes',       icon: Wallet,          label: 'Cartões' },
  { to: '/investimentos', icon: TrendingUp,      label: 'Investimentos' },
  { to: '/a-receber',     icon: HandCoins,       label: 'A Receber' },
]

export default function Layout({ children }) {
  const [open, setOpen]   = useState(false)
  const { user, profile } = useAuth()
  const displayName       = profile?.name || user?.email?.split('@')[0] || 'Usuário'
  const initials          = displayName.slice(0, 2).toUpperCase()

  return (
    <div className={styles.wrap}>
      <button className={styles.menuBtn} onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>₢</span>
          <div>
            <p className={styles.logoTitle}>Finanças</p>
            <p className={styles.logoSub}>Painel Pessoal</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={() => setOpen(false)}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userRow}>
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userEmail}>{user?.email}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={() => signOut()}>
            <LogOut size={15} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {open && <div className={styles.overlay} onClick={() => setOpen(false)} />}

      <main className={styles.main}>{children}</main>
    </div>
  )
}
