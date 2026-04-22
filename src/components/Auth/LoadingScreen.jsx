import styles from './LoadingScreen.module.scss'

export default function LoadingScreen({ message = 'Carregando...' }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.logoIcon}>₢</div>
        <div className={styles.spinner} />
        <p className={styles.msg}>{message}</p>
      </div>
    </div>
  )
}
