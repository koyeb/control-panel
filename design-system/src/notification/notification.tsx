import clsx from 'clsx';
import IconCheck from 'lucide-static/icons/check.svg?react';
import IconAlertCircle from 'lucide-static/icons/circle-alert.svg?react';
import IconInfoCircle from 'lucide-static/icons/info.svg?react';
import IconAlertTriangle from 'lucide-static/icons/triangle-alert.svg?react';
import IconXClose from 'lucide-static/icons/x.svg?react';

import { StatusIcon } from '../status-icon/status-icon';

type NotificationVariant = 'success' | 'info' | 'warning' | 'error';

type NotificationProps = {
  title?: React.ReactNode;
  variant?: NotificationVariant;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function Notification({ title, variant = 'info', onClose, className, children }: NotificationProps) {
  return (
    <div
      className={clsx(
        'row items-start gap-3 rounded border bg-popover/90 px-4 py-3 shadow-md backdrop-blur-sm',
        className,
      )}
    >
      <StatusIcon {...icons[variant]} />

      <div className="col gap-1 self-center">
        {title && <div className="text-base font-semibold">{title}</div>}
        {children && <div>{children}</div>}
      </div>

      <button className="ml-auto" onClick={onClose}>
        <IconXClose className="size-4" />
      </button>
    </div>
  );
}

const icons: Record<NotificationVariant, React.ComponentProps<typeof StatusIcon>> = {
  success: { color: 'green', Icon: IconCheck },
  info: { color: 'blue', Icon: IconInfoCircle },
  warning: { color: 'orange', Icon: IconAlertTriangle },
  error: { color: 'red', Icon: IconAlertCircle },
};
