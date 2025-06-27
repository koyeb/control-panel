import clsx from 'clsx';

type IntroProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  cta: React.ReactNode;
  className?: string;
};

export function Intro({ icon, title, description, cta, className }: IntroProps) {
  return (
    <div className={clsx('col h-full items-start justify-center gap-4', className)}>
      <div>
        <p className="mb-2 row items-center gap-2 text-lg font-semibold">
          {icon}
          {title}
        </p>

        <p className="text-dim">{description}</p>
      </div>

      {cta}
    </div>
  );
}
