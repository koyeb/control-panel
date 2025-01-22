import { ToastContainer, ToastContentProps, cssTransition } from 'react-toastify';

import { Notification } from '@koyeb/design-system';

export function NotificationContainer() {
  return (
    <ToastContainer transition={transition} autoClose={5 * 1000} closeButton={false} hideProgressBar={true} />
  );
}

const transition = cssTransition({
  enter: 'notification-enter',
  exit: 'notification-exit',
  collapseDuration: 240,
});

export function Toast({ closeToast, data }: ToastContentProps<React.ComponentProps<typeof Notification>>) {
  return <Notification {...data} className="flex-1" onClose={closeToast} />;
}
