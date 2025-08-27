import { Link } from 'src/components/link';
import { IconTriangleAlert } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.oneClickApps.details.notFound');

export function AppNotFound() {
  const link = (children: React.ReactNode) => (
    <Link to="/one-click-apps" className="text-link font-medium">
      {children}
    </Link>
  );

  return (
    <div className="col min-h-[calc(100vh-12rem)] items-center justify-center gap-6">
      <IconTriangleAlert className="size-14 text-dim" />

      <div className="text-3xl font-medium">
        <T id="title" />
      </div>

      <div className="text-base text-dim">
        <T id="description" values={{ link }} />
      </div>
    </div>
  );
}
