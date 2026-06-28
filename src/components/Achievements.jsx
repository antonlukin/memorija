import styles from './Achievements.module.scss'

import { getAchievements } from '../storage'
import { IconArrowLeft, IconCheck, IconTrophy, IconGlobe, IconFlame, IconStar, IconMap, IconPin } from './icons'

const GROUP_ICON = {
  collection: <IconGlobe />,
  continent: <IconMap />,
  capital: <IconPin />,
  streak: <IconFlame />,
  volume: <IconStar />,
}

function Achievements({ onBack }) {
  const list = getAchievements()
  const unlocked = list.filter((item) => item.unlocked).length

  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <button className={styles.back} onClick={onBack} aria-label="Back to menu"><IconArrowLeft /></button>
        <span className={styles.mode}>Achievements</span>
        <span className={styles.score}>{unlocked}<i>/{list.length}</i></span>
      </header>

      <div className={styles.list}>
        {list.map((item) => (
          <div key={item.id} className={item.unlocked ? `${styles.card} ${styles.done}` : styles.card}>
            <span className={styles.icon}>{GROUP_ICON[item.group] || <IconTrophy />}</span>

            <div className={styles.text}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.desc}>{item.desc}</span>

              {!item.unlocked && item.target > 1 &&
                <div className={styles.progress}>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${Math.round((item.current / item.target) * 100)}%` }} />
                  </div>
                  <span className={styles.frac}>{item.current}/{item.target}</span>
                </div>
              }
            </div>

            {item.unlocked &&
              <span className={styles.tick}><IconCheck /></span>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

export default Achievements
