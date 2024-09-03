import clsx from 'clsx';

import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { BadgeNew } from 'src/components/badge-new';
import {
  IconActivity,
  IconBoxes,
  IconFileKey,
  IconFolders,
  IconGlobe,
  IconLayoutDashboard,
  IconSettings,
  IconUsers,
} from 'src/components/icons';
import { Link } from 'src/components/link';
import { usePathname } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

const T = Translate.prefix('layouts.main.navigation');

export function Navigation({ collapsed }: { collapsed: boolean }) {
  const organization = useOrganizationUnsafe();

  const disableComputeLinks =
    organization === undefined || inArray(organization.status, ['deactivating', 'deactivated']);

  return (
    <nav className="flex-1">
      <ol className="col gap-1 sm:gap-2">
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

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconFolders}
          label={<T id="volumes" />}
          href={routes.volumes()}
          newBadge
        />

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
