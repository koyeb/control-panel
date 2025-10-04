import { ButtonMenuItem, MenuItem } from '@koyeb/design-system';

import { ActionsMenu } from 'src/components/actions-menu';
import { openDialog } from 'src/components/dialog';
import { LinkMenuItem } from 'src/components/link';
import { IconEllipsis } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { App } from 'src/model';

const T = createTranslate('pages.home');

export function AppActions({ app }: { app: App }) {
  return (
    <ActionsMenu Icon={IconEllipsis}>
      {(withClose, onClose) => (
        <>
          <MenuItem className="text-dim hover:!bg-inherit">
            <T id="appActions.label" />
          </MenuItem>

          <LinkMenuItem to="/services/new" search={{ app_id: app.id }} onClick={onClose}>
            <T id="appActions.addService" />
          </LinkMenuItem>

          <LinkMenuItem to="/domains" onClick={onClose} state={{ create: true }}>
            <T id="appActions.addDomain" />
          </LinkMenuItem>

          <ButtonMenuItem onClick={withClose(() => openDialog('EditApp', app))}>
            <T id="appActions.edit" />
          </ButtonMenuItem>

          <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmPauseApp', app))}>
            <T id="appActions.pauseServices" />
          </ButtonMenuItem>

          <ButtonMenuItem onClick={withClose(() => openDialog('ConfirmDeleteApp', app))}>
            <T id="appActions.deleteApp" />
          </ButtonMenuItem>
        </>
      )}
    </ActionsMenu>
  );
}
