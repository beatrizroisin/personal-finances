import { useState } from 'react'
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { signIn, signUp } from '../../lib/supabase'
import styles from './AuthPage.module.scss'

export default function AuthPage() {
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const reset = () => { setError(''); setSuccess('') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    reset()
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    if (mode === 'register' && !name) { setError('Digite seu nome.'); return }
    if (password.length < 6) { setError('Senha deve ter ao menos 6 caracteres.'); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password)
        if (err) throw err
        // AuthContext will detect the session change automatically
      } else {
        const { error: err } = await signUp(email, password, name)
        if (err) throw err
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro, depois faça login.')
        setMode('login')
        setPassword('')
      }
    } catch (err) {
      const msg = err.message || 'Erro desconhecido'
      if (msg.includes('Invalid login'))      setError('E-mail ou senha incorretos.')
      else if (msg.includes('already regist')) setError('Este e-mail já está cadastrado.')
      else if (msg.includes('Email not conf')) setError('Confirme seu e-mail antes de entrar.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>₢</span>
          <div>
            <h1 className={styles.logoTitle}>Finanças Pessoais</h1>
            <p className={styles.logoSub}>Seu controle financeiro privado</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
            onClick={() => { setMode('login'); reset() }}
          >
            <LogIn size={15} /> Entrar
          </button>
          <button
            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
            onClick={() => { setMode('register'); reset() }}
          >
            <UserPlus size={15} /> Criar conta
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Name — only on register */}
          {mode === 'register' && (
            <div className={styles.field}>
              <label>Seu nome</label>
              <input
                type="text"
                placeholder="Como você quer ser chamado"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          {/* Email */}
          <div className={styles.field}>
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete={mode === 'login' ? 'username' : 'email'}
            />
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label>Senha</label>
            <div className={styles.passWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error / Success messages */}
          {error && (
            <div className={styles.msgError}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {success && (
            <div className={styles.msgSuccess}>
              <CheckCircle size={14} /> {success}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <span className={styles.spinner} />
            ) : mode === 'login' ? (
              <><LogIn size={16} /> Entrar</>
            ) : (
              <><UserPlus size={16} /> Criar minha conta</>
            )}
          </button>
        </form>

        {/* Features list */}
        <div className={styles.features}>
          {['Dados 100% privados', 'Cada usuário vê só o seu', 'Sincronizado em qualquer dispositivo'].map(f => (
            <span key={f} className={styles.feature}>
              <span className={styles.featureDot} />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
