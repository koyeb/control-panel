import { Button } from '@koyeb/design-system';

import { type OneClickApp } from 'src/api/model';
import { IconArrowRight, IconDatabase, IconGlobe, IconSettings } from 'src/components/icons';
import { Intro } from 'src/components/intro';
import { urlToLinkOptions, useNavigate } from 'src/hooks/router';
import { useShortcut } from 'src/hooks/shortcut';
import { createTranslate } from 'src/intl/translate';

import { useCreateServiceDialog } from '../use-create-service-dialog';

const T = createTranslate('modules.createServiceDialog');

export function WebService() {
  const { serviceTypeChanged } = useCreateServiceDialog();

  const onCreate = () => {
    serviceTypeChanged('web');
  };

  useShortcut(['Enter'], onCreate);

  return (
    <Intro
      icon={<IconGlobe className="icon" />}
      title={<T id="webService" />}
      description={<T id="webServiceDescription" />}
      cta={
        <Button onClick={onCreate}>
          <T id="createService" values={{ serviceType: <T id="webService" /> }} />
          <IconArrowRight />
        </Button>
      }
      className="p-6"
    />
  );
}

export function Worker() {
  const { serviceTypeChanged } = useCreateServiceDialog();

  const onCreate = () => {
    serviceTypeChanged('worker');
  };

  useShortcut(['Enter'], onCreate);

  return (
    <Intro
      icon={<IconSettings className="icon" />}
      title={<T id="worker" />}
      description={<T id="workerDescription" />}
      cta={
        <Button onClick={onCreate}>
          <T id="createService" values={{ serviceType: <T id="worker" /> }} />
          <IconArrowRight />
        </Button>
      }
      className="p-6"
    />
  );
}

export function Database() {
  const navigate = useNavigate();
  const { closeDialog } = useCreateServiceDialog();

  const onCreate = () => {
    navigate({ to: '/database-services/new' });
    closeDialog();
  };

  useShortcut(['Enter'], onCreate);

  return (
    <Intro
      icon={<IconDatabase className="icon" />}
      title={<T id="database" />}
      description={<T id="databaseDescription" />}
      cta={
        <Button onClick={onCreate}>
          <T id="createService" values={{ serviceType: <T id="database" /> }} />
          <IconArrowRight />
        </Button>
      }
      className="p-6"
    />
  );
}

type OneClickAppProps = {
  app: OneClickApp;
};

export function OneClickApp({ app }: OneClickAppProps) {
  const navigate = useNavigate();
  const { closeDialog } = useCreateServiceDialog();

  const deploy = () => {
    navigate(urlToLinkOptions(app.deployUrl));
    closeDialog();
  };

  useShortcut(['Enter'], deploy);

  return (
    <Intro
      icon={<img src={app.logo} className="icon rounded-full bg-inverted grayscale" />}
      title={app.name}
      description={app.description}
      cta={
        <Button onClick={deploy}>
          <T id="deployOneClickApp" values={{ name: app.name }} />
          <IconArrowRight />
        </Button>
      }
      className="p-6"
    />
  );
}
