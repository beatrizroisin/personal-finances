import styles from './StatCard.module.scss';

export default function StatCard({ label, value, icon: Icon, color = 'accent', sub }) {
  return (
    <div className={`${styles.card} ${styles[color]} animate-in`}>
      <div className={styles.top}>
        {Icon && (
          <span className={styles.icon}>
            <Icon size={18} />
          </span>
        )}
        <span className={styles.label}>{label}</span>
      </div>
      <p className={styles.value}>{value}</p>
      {sub && <p className={styles.sub}>{sub}</p>}
    </div>
  );
}
