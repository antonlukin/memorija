import styles from './Progress.module.scss'

import { getSummary } from '../storage'

function Bar({ value, total }) {
  const percent = total ? Math.round((value / total) * 100) : 0
  return (
    <div className={styles.track}>
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  )
}

function Progress() {
  const summary = getSummary()

  return (
    <div className={styles.progress}>
      <div className={styles.head}>
        <span className={styles.label}>Mastered</span>
        <span className={styles.count}>
          {summary.mastered}<i>/{summary.total}</i>
        </span>
      </div>

      <Bar value={summary.mastered} total={summary.total} />

      <div className={styles.continents}>
        {summary.continents.map((item) => (
          <div key={item.key} className={styles.continent}>
            <div className={styles.ctop}>
              <span className={styles.cname}>{item.label}</span>
              <span className={styles.cval}>{item.mastered}/{item.total}</span>
            </div>
            <Bar value={item.mastered} total={item.total} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default Progress
