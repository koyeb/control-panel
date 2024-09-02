import { Button } from '@koyeb/design-system';
import { type ExampleApp } from 'src/api/model';
import { routes } from 'src/application/routes';
import { IconArrowRight, IconDatabase, IconGlobe, IconSettings } from 'src/components/icons';
import { Intro } from 'src/components/intro';
import { useShortcut } from 'src/hooks/shortcut';
import { Translate } from 'src/intl/translate';

import { useCommandPalette } from '../use-command-palette';

const T = Translate.prefix('commandPalette');

export function WebService() {
  const { serviceTypeChanged } = useCommandPalette();

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
  const { serviceTypeChanged } = useCommandPalette();

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
  const { navigate } = useCommandPalette();

  const onCreate = () => {
    navigate(routes.createDatabaseService());
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

type ExampleAppProps = {
  app: ExampleApp;
};

export function ExampleApp({ app }: ExampleAppProps) {
  const { navigate } = useCommandPalette();

  const deploy = () => {
    if (app) {
      navigate(app?.deployUrl);
    }
  };

  useShortcut(['Enter'], deploy);

  if (!app) {
    return null;
  }

  return (
    <Intro
      icon={<img src={app.logo} className="icon rounded-full bg-inverted grayscale" />}
      title={app.name}
      description={app.description}
      cta={
        <Button onClick={deploy}>
          <T id="deployExampleApp" values={{ name: app.name }} />
          <IconArrowRight />
        </Button>
      }
      className="p-6"
    />
  );
}
