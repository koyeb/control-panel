import { SvgComponent } from 'src/application/types';
import { createTranslate } from 'src/intl/translate';

import Autoscaling from './images/autoscaling.svg?react';
import Deploy from './images/deploy.svg?react';
import Global from './images/global.svg?react';
import StartForFree from './images/start-for-free.svg?react';

const T = createTranslate('layouts.secondary');

export function FeaturesList() {
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
  Image: SvgComponent;
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
