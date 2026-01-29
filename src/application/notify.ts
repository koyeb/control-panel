import { toast } from 'react-toastify';
import z from 'zod';

import { Toast } from 'src/components/notification';

import { createValidationGuard } from './validation';

type NotifyOptions = {
  title?: React.ReactNode;
  autoClose?: number | false;
};

interface NotifierPort {
  success(text: React.ReactNode, options?: NotifyOptions): void;
  info(text: React.ReactNode, options?: NotifyOptions): void;
  warning(text: React.ReactNode, options?: NotifyOptions): void;
  error(text: React.ReactNode, options?: NotifyOptions): void;
}

export const notify: NotifierPort = {
  success: createNotify('success'),
  info: createNotify('info'),
  warning: createNotify('warning'),
  error: createNotify('error'),
};

const toasts = new Set<string>();

function createNotify(variant: 'success' | 'info' | 'warning' | 'error') {
  return (children: React.ReactNode, { title, autoClose }: NotifyOptions = {}): void => {
    const text = getNodeText(children);

    if (toasts.has(text)) {
      return;
    }

    toasts.add(text);

    toast(Toast, {
      onClose: () => toasts.delete(text),
      autoClose,
      data: {
        variant,
        title,
        children,
      },
    });
  };
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }

  if (hasChildrenProp(node)) {
    return getNodeText(node.props.children);
  }

  return '';
}

const hasChildrenProp = createValidationGuard(
  z.object({ props: z.object({ children: z.custom<React.ReactNode>() }) }),
);
