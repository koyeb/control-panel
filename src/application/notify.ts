import { toast } from 'react-toastify';

import { Toast } from 'src/components/notification';

type NotifyOptions = {
  title?: React.ReactNode;
  autoClose?: number | false;
};

export interface NotifierPort {
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

function createNotify(variant: 'success' | 'info' | 'warning' | 'error') {
  return (text: React.ReactNode, { title, ...options }: NotifyOptions = {}): void => {
    toast(Toast, {
      ...options,
      data: {
        variant,
        title,
        children: text,
      },
    });
  };
}
