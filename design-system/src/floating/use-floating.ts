import {
  FloatingContext,
  Placement,
  ReferenceType,
  Strategy,
  UseDismissProps,
  UseFloatingOptions,
  UseFocusProps,
  UseHoverProps,
  UseRoleProps,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating as useFloatingUi,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from "@floating-ui/react";

export type UseFloatingProps = {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  referenceElement?: HTMLElement | null;
  floatingElement?: HTMLElement | null;
  placement?: Placement;
  strategy?: Strategy;
  offset?: number;
  middlewares?: UseFloatingOptions["middleware"];
  interactions?: {
    hover?: UseHoverProps;
    dismiss?: UseDismissProps;
    focus?: UseFocusProps;
    role?: UseRoleProps;
  };
};

type UseFloatingReturn = {
  context: FloatingContext;
  styles: React.CSSProperties;
  isMounted: boolean;
  setReference: (ref: ReferenceType | null) => void;
  setFloating: (ref: HTMLElement | null) => void;
  getReferenceProps: () => Record<string, unknown>;
  getFloatingProps: () => Record<string, unknown>;
};

export function useFloating({
  open,
  setOpen,
  referenceElement,
  floatingElement,
  placement = "bottom",
  strategy,
  offset: offsetValue,
  middlewares,
  interactions,
}: UseFloatingProps): UseFloatingReturn {
  const { refs, floatingStyles, context } = useFloatingUi({
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange: setOpen,
    placement,
    strategy,
    elements: {
      reference: referenceElement,
      floating: floatingElement,
    },
    middleware: [offset(offsetValue), flip(), shift(), ...(middlewares ?? [])],
  });

  const hover = useHover(context, interactions?.hover);
  const dismiss = useDismiss(context, interactions?.dismiss);
  const focus = useFocus(context, interactions?.focus);
  const role = useRole(context, interactions?.role);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    dismiss,
    focus,
    role,
  ]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 120,
  });

  return {
    context,
    styles: {
      ...floatingStyles,
      ...transitionStyles,
    },
    isMounted,
    setReference: refs.setReference,
    setFloating: refs.setFloating,
    getReferenceProps,
    getFloatingProps,
  };
}
