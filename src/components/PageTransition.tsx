import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

const noMotion = {
  initial: {},
  animate: {},
  exit: {},
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const v = reduced ? noMotion : variants

  return (
    <motion.div
      variants={v}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  )
}
