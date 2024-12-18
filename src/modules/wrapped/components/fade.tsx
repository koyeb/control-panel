import { motion } from 'motion/react';

type FadeProps = {
  show: boolean;
  delay?: number;
  after?: () => void;
  className?: string;
  children: React.ReactNode;
};

export function Fade({ show, delay, after, className, children }: FadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      onAnimationComplete={() => show && after?.()}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
