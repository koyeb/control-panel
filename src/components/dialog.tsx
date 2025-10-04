/* eslint-disable react-refresh/only-export-components */
import {
  Dialog as BaseDialog,
  DialogFooter as BaseDialogFooter,
  DialogHeader as BaseDialogHeader,
  Button,
} from '@koyeb/design-system';
import { useSyncExternalStore } from 'react';

import { Translate } from 'src/intl/translate';
import {
  App,
  CatalogInstance,
  ComputeDeployment,
  OrganizationPlan,
  RegistrySecret,
  Secret,
  Service,
  Volume,
  VolumeSnapshot,
} from 'src/model';

import { ConfirmationDialogProps } from './confirmation-dialog';
import { UpgradeDialogProps } from './payment-form';

type Dialogs = {
  // api credential
  CreateApiCredential: null;
  ApiCredentialCreated: null;

  // domain
  CreateDomain: null;

  // secret
  CreateSecret: null;
  BulkCreateSecrets: null;
  EditSecret: Secret;
  CreateRegistrySecret: null;
  EditRegistrySecret: RegistrySecret;

  // volume
  EditVolume: Volume;
  CreateSnapshotFromVolume: Volume;
  EditSnapshot: VolumeSnapshot;

  // app
  EditApp: App;

  // service
  RedeployService: Service;
  ResumeService: Service;
  DeploymentDefinition: ComputeDeployment;
  DeploymentsDiff: [ComputeDeployment, ComputeDeployment];
  RequestQuotaIncrease: CatalogInstance;
  BulkEnvironmentVariablesEdition: null;
  CreateVolume: { index: number };

  // database
  CreateLogicalDatabase: null;
  CreateDatabaseRole: null;

  // account / organization
  CreateOrganization: null;

  // misc
  CommandPalette: null;
  ContextPalette: null;
  TrialWelcome: null;
  Confirmation: ConfirmationDialogProps;
  Upgrade: UpgradeDialogProps;
  UpgradeInstanceSelector: OrganizationPlan;
  DownloadUsage: null;
  FeatureFlags: null;
};

export type DialogId = keyof Dialogs;

type DialogProps<Id extends DialogId> = Omit<
  React.ComponentProps<typeof BaseDialog>,
  'open' | 'onClose' | 'children'
> & {
  id: Id;
  children: React.ReactNode | ((context: Dialogs[Id]) => React.ReactNode);
};

export function Dialog<Id extends DialogId>({ id, children, ...props }: DialogProps<Id>) {
  const dialogId = useOpenedDialogId();
  const context = useDialogContext(id);
  const open = id === dialogId;

  return (
    <BaseDialog
      open={open}
      onClose={closeDialog}
      onClosed={() => {
        dialog.clearContext();
        props.onClosed?.();
      }}
      root={document.getElementById('root') ?? undefined}
      {...props}
    >
      {typeof children === 'function' ? open && children(context!) : children}
    </BaseDialog>
  );
}

export function DialogHeader(props: Omit<React.ComponentProps<typeof BaseDialogHeader>, 'onClose'>) {
  return <BaseDialogHeader onClose={closeDialog} {...props} />;
}

export function DialogFooter(props: React.ComponentProps<typeof BaseDialogFooter>) {
  return <BaseDialogFooter {...props} />;
}

export function CloseDialogButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="ghost" color="gray" onClick={() => closeDialog()} {...props}>
      {props.children ?? <Translate id="common.close" />}
    </Button>
  );
}

class DialogContext extends EventTarget {
  private dialog: {
    dialogId?: DialogId;
    context?: unknown;
  } = {};

  openDialog = <Id extends DialogId>(
    dialogId: Id,
    ...context: Dialogs[Id] extends null ? [] : [Dialogs[Id]]
  ) => {
    this.dialog = { dialogId, context: context[0] };
    this.dispatchEvent(new Event('changed'));
  };

  closeDialog = (clearContext = false) => {
    this.dialog = { context: this.dialog.context };

    if (clearContext) {
      this.clearContext();
    }

    this.dispatchEvent(new Event('changed'));
  };

  clearContext = () => {
    delete this.dialog.context;
  };

  subscribe = (cb: () => void) => {
    this.addEventListener('changed', cb);

    return () => {
      this.removeEventListener('changed', cb);
    };
  };

  getSnapshot = () => {
    return this.dialog;
  };
}

const dialog = new DialogContext();

export const openDialog = dialog.openDialog;
export const closeDialog = dialog.closeDialog;

declare global {
  interface Window {
    openDialog: typeof openDialog;
  }
}

window.openDialog = openDialog;

export function useOpenedDialogId() {
  return useSyncExternalStore(dialog.subscribe, dialog.getSnapshot).dialogId;
}

export function useDialogContext<Id extends DialogId>(id: Id) {
  const { dialogId, context } = useSyncExternalStore(dialog.subscribe, dialog.getSnapshot);

  if (id === dialogId) {
    return context as Dialogs[Id];
  }
}
