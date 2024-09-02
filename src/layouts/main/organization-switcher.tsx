import { size } from '@floating-ui/react';
import { useState } from 'react';

import { Floating } from '@koyeb/design-system';
import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { IconChevronUpDown } from 'src/components/icons';
import { GeneratedAvatar, OrganizationAvatar } from 'src/components/organization-avatar';
import { TextSkeleton } from 'src/components/skeleton';

import { OrganizationSwitcherMenu } from '../organization-switcher-menu';

export function OrganizationSwitcher() {
  const currentOrganization = useOrganizationUnsafe();
  const [open, setOpen] = useState(false);

  if (currentOrganization === undefined) {
    return <Skeleton />;
  }

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      strategy="fixed"
      placement="bottom-start"
      offset={8}
      middlewares={[
        size({
          apply({ rects, elements }) {
            Object.assign(elements.floating.style, { minWidth: `${rects.reference.width}px` });
          },
        }),
      ]}
      renderReference={(ref, props) => (
        <button
          ref={ref}
          type="button"
          data-testid="organization-switcher"
          className="row items-center gap-2 rounded-lg border px-3 py-1 text-start"
          onClick={() => setOpen(!open)}
          {...props}
        >
          <OrganizationAvatar className="size-6 rounded-full" />
          <span className="flex-1 truncate font-medium">{currentOrganization.name}</span>
          <IconChevronUpDown className="size-4 text-dim" />
        </button>
      )}
      renderFloating={(ref, props) => (
        <OrganizationSwitcherMenu
          ref={ref}
          onClose={() => setOpen(false)}
          showCreateOrganization
          {...props}
        />
      )}
    />
  );
}

function Skeleton() {
  return (
    <button disabled type="button" className="row items-center gap-2 rounded-lg border px-3 py-1 text-start">
      <GeneratedAvatar seed="" className="size-6 rounded-full" />
      <TextSkeleton width={6} />
      <IconChevronUpDown className="ml-auto size-4 text-dim" />
    </button>
  );
}
