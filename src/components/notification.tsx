import { ToastContainer, ToastContentProps, cssTransition } from 'react-toastify';
import 'react-toastify/ReactToastify.minimal.css';

import { Notification } from '@koyeb/design-system';

export function NotificationContainer() {
  return (
    <ToastContainer
      transition={transition}
      autoClose={5 * 1000}
      closeButton={false}
      hideProgressBar={true}
      toastClassName="relative py-1 col"
      bodyClassName="flex-1"
    />
  );
}

const transition = cssTransition({
  enter: 'notification-enter',
  exit: 'notification-exit',
  collapseDuration: 240,
});

export function Toast({ closeToast, data }: ToastContentProps<React.ComponentProps<typeof Notification>>) {
  return <Notification {...data} onClose={closeToast} />;
}
