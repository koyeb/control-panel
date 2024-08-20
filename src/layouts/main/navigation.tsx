import clsx from 'clsx';
import IconActivity from 'lucide-static/icons/activity.svg?react';
import IconBoxes from 'lucide-static/icons/boxes.svg?react';
import IconFileKey from 'lucide-static/icons/file-key.svg?react';
import IconFolders from 'lucide-static/icons/folders.svg?react';
import IconGlobe from 'lucide-static/icons/globe.svg?react';
import IconLayoutDashboard from 'lucide-static/icons/layout-dashboard.svg?react';
import IconSettings from 'lucide-static/icons/settings.svg?react';
import IconUsers from 'lucide-static/icons/users.svg?react';

import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { BadgeNew } from 'src/components/badge-new';
import { Link } from 'src/components/link';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { usePathname } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

const T = Translate.prefix('layouts.main.navigation');

export function Navigation({ collapsed }: { collapsed: boolean }) {
  const organization = useOrganizationUnsafe();

  const disableComputeLinks =
    organization === undefined || inArray(organization.status, ['deactivating', 'deactivated']);

  const showVolumes = useFeatureFlag('volumes');

  return (
    <nav className="flex-1">
      <ol className="col gap-2">
        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconLayoutDashboard}
          label={<T id="overview" />}
          href={routes.home()}
          isActive={(pathname) => pathname === routes.home()}
        />

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconBoxes}
          label={<T id="services" />}
          href={routes.appsList()}
          isActive={(pathname) =>
            pathname.startsWith('/services') || pathname.startsWith('/database-services')
          }
        />

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconGlobe}
          label={<T id="domains" />}
          href={routes.domains()}
        />

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconFileKey}
          label={<T id="secrets" />}
          href={routes.secrets()}
        />

        {showVolumes && (
          <NavigationItem
            collapsed={collapsed}
            disabled={disableComputeLinks}
            Icon={IconFolders}
            label={<T id="volumes" />}
            href={routes.volumes()}
            newBadge
          />
        )}

        <NavigationItem
          collapsed={collapsed}
          Icon={IconActivity}
          label={<T id="activity" />}
          href={routes.activity()}
        />

        <NavigationItem collapsed={collapsed} Icon={IconUsers} label={<T id="team" />} href={routes.team()} />

        <NavigationItem
          collapsed={collapsed}
          Icon={IconSettings}
          label={<T id="settings" />}
          href={routes.organizationSettings.index()}
        />
      </ol>
    </nav>
  );
}

type NavigationItemProps = {
  collapsed: boolean;
  disabled?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
  label: React.ReactNode;
  href: string;
  isActive?: (pathname: string) => boolean;
  newBadge?: boolean;
};

function NavigationItem({ collapsed, disabled, Icon, label, href, isActive, newBadge }: NavigationItemProps) {
  const pathname = usePathname();
  const active = isActive?.(pathname) ?? pathname.startsWith(href);

  return (
    <li className={clsx('mx-3 rounded', active && 'bg-muted', !active && 'text-dim')}>
      <Link
        href={href}
        aria-disabled={disabled}
        className={clsx('row items-center gap-2 p-2 hover:text-default', disabled && 'pointer-events-none')}
      >
        <div>
          <Icon className="size-icon" />
        </div>

        {!collapsed && <span className="font-medium">{label}</span>}

        {!collapsed && newBadge && <BadgeNew className="ml-auto" />}
      </Link>
    </li>
  );
}
