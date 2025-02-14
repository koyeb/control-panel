import { FloatingArrow, FloatingPortal } from '@floating-ui/react';
import clsx from 'clsx';
import IconInfo from 'lucide-static/icons/info.svg?react';
import { useState } from 'react';

import { UseTooltipProps, useTooltip } from './use-tooltip';

type TooltipChildrenProps = Record<string, unknown> & {
  ref: (element: Element | null) => void;
};

type TooltipOwnProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  title?: React.ReactNode;
  content: React.ReactNode;
  color?: TooltipElementProps['color'];
  className?: string;
  children: (props: TooltipChildrenProps) => React.ReactNode;
};

type TooltipProps = Omit<UseTooltipProps, 'open' | 'setOpen'> & TooltipOwnProps;

export function Tooltip({ content, title, color, className, children, ...props }: TooltipProps) {
  const [open, setOpen] = useState(false);

  const { getReferenceProps, setReference, ...tooltip } = useTooltip({
    open,
    setOpen,
    ...props,
  });

  const reference = children({
    ref: setReference,
    ...getReferenceProps(),
  });

  if (!content) {
    return reference;
  }

  return (
    <>
      {reference}

      <TooltipElement {...tooltip} color={color} arrow={props.arrow ?? true} className={className}>
        {title && <div className="font-semibold">{title}</div>}
        <div className="text-xs font-medium">{content}</div>
      </TooltipElement>
    </>
  );
}

type TooltipElementProps = Omit<ReturnType<typeof useTooltip>, 'setReference' | 'getReferenceProps'> & {
  color?: 'neutral' | 'inverted';
  arrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

function TooltipElement({
  color = 'inverted',
  context,
  styles,
  isMounted,
  arrowSize,
  arrowElement,
  arrow,
  setFloating,
  getFloatingProps,
  className,
  children,
}: TooltipElementProps) {
  if (!isMounted) {
    return null;
  }

  return (
    <FloatingPortal>
      <div
        ref={setFloating}
        style={styles}
        className={clsx(
          'col z-40 max-w-80 gap-1 rounded-lg p-2 shadow-lg',
          {
            'bg-neutral': color === 'neutral',
            'bg-inverted text-inverted': color === 'inverted',
          },
          className,
        )}
        {...getFloatingProps()}
      >
        {children}
        {arrow && (
          <FloatingArrow
            ref={arrowElement}
            context={context}
            height={arrowSize}
            className={clsx({
              'fill-neutral': color === 'neutral',
              'fill-inverted': color === 'inverted',
            })}
          />
        )}
      </div>
    </FloatingPortal>
  );
}

type InfoTooltipProps = Omit<TooltipProps, 'children'> & {
  iconClassName?: string;
};

export function InfoTooltip({ iconClassName, ...props }: InfoTooltipProps) {
  return (
    <Tooltip {...props}>
      {(props) => <IconInfo {...props} className={clsx('size-4', iconClassName)} />}
    </Tooltip>
  );
}
