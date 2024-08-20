import clsx from 'clsx';

import { ThemeMode, useForceThemeMode } from 'src/hooks/theme';
import { Translate } from 'src/intl/translate';

import Autoscaling from './images/autoscaling.svg?react';
import BGGridDark from './images/bg-grid-dark.svg';
import BGGridLight from './images/bg-grid-light.svg';
import Deploy from './images/deploy.svg?react';
import Global from './images/global.svg?react';
import StartForFree from './images/start-for-free.svg?react';
import { SecondaryLayoutHeader } from './secondary-layout-header';

const T = Translate.prefix('layouts.secondary');

type SecondaryLayoutTwoTonesProps = {
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

export function SecondaryLayoutTwoTones({
  className,
  contentClassName,
  children,
}: SecondaryLayoutTwoTonesProps) {
  useForceThemeMode(ThemeMode.light);

  return (
    <div className={clsx('secondary-layout col h-screen', className)}>
      <div className="row fixed inset-0 -z-10 flex-1">
        <div className="dark flex-1" style={{ backgroundImage: `url("${BGGridDark}")` }} />
        <div className="hidden flex-1 lg:block" style={{ backgroundImage: `url("${BGGridLight}")` }} />
      </div>

      <SecondaryLayoutHeader />

      <div className="row flex-1">
        <div className="col dark flex-1 items-center justify-center overflow-y-auto bg-transparent px-4">
          <div className={clsx('w-full max-w-xl', contentClassName)}>{children}</div>
        </div>

        <div className="lg:col hidden flex-1 items-center justify-center px-4">
          <FeaturesList />
        </div>
      </div>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="fixed bottom-0 right-0 -z-10 size-72 translate-x-6 translate-y-24 bg-green opacity-40 blur-[8rem] md:opacity-100" />
    </div>
  );
}

function FeaturesList() {
  return (
    <ul className="col max-w-sm gap-6 font-gilroy">
      <FeatureItem
        Image={StartForFree}
        title={<T id="startForFree.title" />}
        description={<T id="startForFree.description" />}
      />

      <FeatureItem
        Image={Deploy}
        title={<T id="deploy.title" />}
        description={<T id="deploy.description" />}
      />

      <FeatureItem
        Image={Global}
        title={<T id="global.title" />}
        description={<T id="global.description" />}
      />

      <FeatureItem
        Image={Autoscaling}
        title={<T id="autoscaling.title" />}
        description={<T id="autoscaling.description" />}
      />
    </ul>
  );
}

type FeatureItemProps = {
  Image: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: React.ReactNode;
  description: React.ReactNode;
};

function FeatureItem({ Image, title, description }: FeatureItemProps) {
  return (
    <li className="row items-start gap-4">
      <Image width={40} height={40} className="rounded-lg bg-green p-2" />

      <div className="col flex-1 gap-2">
        <div className="text-lg">{title}</div>
        <div className="text-base text-dim">{description}</div>
      </div>
    </li>
  );
}
