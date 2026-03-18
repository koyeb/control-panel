import { createFileRoute } from '@tanstack/react-router';

import { useCurrentProjectId } from 'src/api/hooks/project';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { DefaultProjectAlert } from 'src/modules/project/default-project-alert';
import { DeleteProject } from 'src/modules/project/delete-project';
import { ProjectName } from 'src/modules/project/project-name';

const T = createTranslate('pages.projectSettings');

export const Route = createFileRoute('/_main/project/settings/')({
  component: RouteComponent,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.to} />,
  }),
});

function RouteComponent() {
  const [projectId] = useCurrentProjectId();

  return (
    <div key={projectId} className="col gap-8">
      <h1 className="text-xl font-medium">
        <T id="title" />
      </h1>

      <DefaultProjectAlert />
      <ProjectName />
      <DeleteProject />
    </div>
  );
}
