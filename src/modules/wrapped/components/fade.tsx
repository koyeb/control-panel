import { motion } from 'motion/react';

type FadeProps = {
  show: boolean;
  delay?: number;
  after?: () => void;
  children: React.ReactNode;
};

export function Fade({ show, delay, after, children }: FadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      onAnimationComplete={() => show && after?.()}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
