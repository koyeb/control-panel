import clsx from 'clsx';
import { Fragment } from 'react/jsx-runtime';

import { detectOperatingSystem } from 'src/application/detect-operating-system';
import { useShortcut } from 'src/hooks/shortcut';

type ShortcutProps = {
  keystrokes: string[];
  icon?: React.ReactNode;
  disabled?: boolean;
  onTrigger?: () => void;
  className?: string;
  keystrokeClassName?: string;
};

export function Shortcut({
  keystrokes,
  icon,
  disabled,
  onTrigger,
  className,
  keystrokeClassName,
}: ShortcutProps) {
  useShortcut(keystrokes, disabled ? () => {} : onTrigger);

  return (
    <span
      className={clsx(
        'hidden rounded-md bg-neutral px-1 py-0.5 text-xs whitespace-nowrap text-dim shadow sm:inline dark:bg-muted',
        className,
      )}
    >
      {keystrokes.map((keystroke, index) => (
        <Fragment key={keystroke}>
          <Keystroke keystroke={keystroke} icon={icon} className={keystrokeClassName} />
          {index < keystrokes.length - 1 && ' + '}
        </Fragment>
      ))}
    </span>
  );
}

type KeystrokeProps = {
  keystroke: string;
  icon?: React.ReactNode;
  className?: string;
};

function Keystroke({ className, icon, keystroke }: KeystrokeProps) {
  return (
    <kbd className={clsx('font-sans', className)}>
      {icon ?? (keystroke === 'meta' ? <Meta /> : keystroke)}
    </kbd>
  );
}

function Meta() {
  if (detectOperatingSystem() === 'mac') {
    return '⌘';
  } else {
    return 'Ctrl';
  }
}
