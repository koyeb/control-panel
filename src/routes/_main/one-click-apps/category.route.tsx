import { Outlet, createFileRoute } from '@tanstack/react-router';

import { Translate, TranslationKeys } from 'src/intl/translate';
import { Crumb } from 'src/layouts/main/app-breadcrumbs';

export const Route = createFileRoute('/_main/one-click-apps/category')({
  component: Outlet,

  beforeLoad: () => ({
    breadcrumb: () => (
      <Crumb>
        <Translate id={`layouts.main.breadcrumbs.${Route.fullPath}` as TranslationKeys} />
      </Crumb>
    ),
  }),
});
