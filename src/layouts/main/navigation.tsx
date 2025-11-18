import clsx from 'clsx';

import { useOrganization } from 'src/api';
import { BadgeNew } from 'src/components/badge-new';
import { Link, ValidateLinkOptions } from 'src/components/link';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { usePathname } from 'src/hooks/router';
import {
  IconActivity,
  IconBox,
  IconBoxes,
  IconFileKey,
  IconFolders,
  IconGlobe,
  IconLayoutDashboard,
  IconSettings,
  IconUsers,
} from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

const T = createTranslate('layouts.main.navigation');

export function Navigation({ collapsed }: { collapsed: boolean }) {
  const organization = useOrganization();

  const disableComputeLinks =
    organization === undefined || inArray(organization.status, ['WARNING', 'DEACTIVATING', 'DEACTIVATED']);

  return (
    <nav className="flex-1">
      <ol className="col gap-1 sm:gap-2">
        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconLayoutDashboard}
          label={<T id="overview" />}
          to="/"
          isActive={(pathname) => pathname === '/'}
        />

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconBoxes}
          label={<T id="services" />}
          to="/services"
          isActive={(pathname) =>
            pathname.startsWith('/services') || pathname.startsWith('/database-services')
          }
        />

        <FeatureFlag feature="sandbox">
          {organization?.plan !== 'hobby' && (
            <NavigationItem
              collapsed={collapsed}
              disabled={disableComputeLinks}
              Icon={IconBox}
              label={<T id="sandboxes" />}
              to="/sandboxes"
              newBadge
            />
          )}
        </FeatureFlag>

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconGlobe}
          label={<T id="domains" />}
          to="/domains"
        />

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconFileKey}
          label={<T id="secrets" />}
          to="/secrets"
        />

        <NavigationItem
          collapsed={collapsed}
          disabled={disableComputeLinks}
          Icon={IconFolders}
          label={<T id="volumes" />}
          to="/volumes"
          newBadge
        />

        <NavigationItem
          collapsed={collapsed}
          Icon={IconActivity}
          label={<T id="activity" />}
          to="/activity"
        />

        <NavigationItem collapsed={collapsed} Icon={IconUsers} label={<T id="team" />} to="/team" />

        <NavigationItem
          collapsed={collapsed}
          Icon={IconSettings}
          label={<T id="settings" />}
          to="/settings"
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
  to: ValidateLinkOptions['to'];
  isActive?: (pathname: string) => boolean;
  newBadge?: boolean;
};

function NavigationItem({ collapsed, disabled, Icon, label, to, isActive, newBadge }: NavigationItemProps) {
  const pathname = usePathname();
  const active = isActive?.(pathname) ?? pathname.startsWith(to);

  return (
    <li className={clsx('mx-3 rounded', active && 'bg-muted', !active && 'text-dim')}>
      <Link
        to={to}
        aria-disabled={disabled}
        className="row items-center gap-2 p-2 hover:text-default aria-disabled:pointer-events-none aria-disabled:text-dim/50"
      >
        <div>
          <Icon className="size-icon" />
        </div>

        {!collapsed && <span className="font-medium">{label}</span>}

        {!collapsed && newBadge && (
          <BadgeNew className="ml-auto">
            <T id="preview" />
          </BadgeNew>
        )}
      </Link>
    </li>
  );
}
