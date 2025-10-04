import { Alert, Button } from '@koyeb/design-system';

import { openDialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { Service } from 'src/model';

const T = createTranslate('pages.service.layout.servicePaused');

export function ServicePausedAlert({ service }: { service: Service }) {
  if (service.status !== 'PAUSED') {
    return null;
  }

  return (
    <Alert
      variant="info"
      title={<T id="title" />}
      description={<T id={service.type === 'worker' ? 'descriptionWorker' : 'description'} />}
    >
      <Button
        color="blue"
        onClick={() => openDialog('ResumeService', service)}
        className="ml-auto self-center"
      >
        <T id="resume" />
      </Button>
    </Alert>
  );
}
