type ProgressBarProps = {
  progress?: number;
  className?: string;
};

export const ProgressBar = ({ progress = 0, className }: ProgressBarProps) => {
  const percent = Math.round(progress * 100);

  return (
    <div className={className}>
      <div className="relative h-1 bg-green">
        <div
          // eslint-disable-next-line tailwindcss/no-arbitrary-value
          className="absolute right-0 h-full bg-black/40 transition-[width] will-change-[width] dark:bg-white/80"
          style={{ width: `${100 - percent}%` }}
        />
      </div>

      <div className="mt-1 text-center text-xs text-dim">{percent}%</div>
    </div>
  );
};
