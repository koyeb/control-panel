import clsx from 'clsx';
import IconAlert from 'lucide-static/icons/circle-alert.svg?react';
import IconInfo from 'lucide-static/icons/info.svg?react';

import { StatusIcon } from '../status-icon/status-icon';

type AlertVariant = 'neutral' | 'info' | 'error' | 'warning';
type AlertStyle = 'solid' | 'outline';

type AlertProps = {
  variant?: AlertVariant;
  style?: AlertStyle;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function Alert({
  variant = 'neutral',
  style = 'solid',
  icon,
  title,
  description,
  className,
  children,
}: AlertProps) {
  return (
    <div
      className={clsx(
        'col sm:row items-start gap-3 rounded-lg border px-4 py-3 sm:items-stretch',
        {
          'border-blue': variant === 'info',
          'border-red': variant === 'error',
          'border-orange': variant === 'warning',
        },
        style === 'solid' && {
          'bg-blue/5': variant === 'info',
          'bg-red/5': variant === 'error',
          'bg-orange/5': variant === 'warning',
        },
        className,
      )}
    >
      {icon ?? <StatusIcon {...icons[variant]} className="self-start" />}

      <div className="col me-auto items-start justify-center gap-1">
        {title && <span className="text-base font-medium">{title}</span>}
        {description && <span>{description}</span>}
      </div>

      {children}
    </div>
  );
}

const icons: Record<AlertVariant, React.ComponentProps<typeof StatusIcon>> = {
  neutral: { Icon: IconInfo, color: 'gray' },
  info: { Icon: IconInfo, color: 'blue' },
  error: { Icon: IconAlert, color: 'red' },
  warning: { Icon: IconAlert, color: 'orange' },
};
