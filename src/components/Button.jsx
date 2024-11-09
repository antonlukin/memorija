import styles from './Button.module.scss'

function Button({isPrimary, isWarning, children, ...rest}) {
  const classes = [styles.button];

  if (isPrimary) {
    classes.push(styles.primary)
  }

  if (isWarning) {
    classes.push(styles.warning)
  }

  return (
    <button className={classes.join(' ')} {...rest}>
      {children}
    </button>
  )
}

export default Button