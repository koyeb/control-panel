import { InfoTooltip, Input, InputEnd } from '@koyeb/design-system';
import { CopyIconButton } from 'src/application/copy-icon-button';
import { createTranslate } from 'src/intl/translate';

import { ExternalLink } from './link';

const T = createTranslate('deployToKoyebButton');

export function DeployToKoyebButton({ deployUrl }: { deployUrl?: string }) {
  if (deployUrl === undefined) {
    return null;
  }

  const markdown = `[![Deploy to Koyeb](https://www.koyeb.com/static/images/deploy/button.svg)](${deployUrl})`;

  return (
    <div className="card col gap-4 p-4">
      <div className="row items-center gap-2 font-medium">
        <T id="title" />
        <InfoTooltip content={<T id="tooltip" />} />
      </div>

      <Input
        readOnly
        value={markdown}
        inputClassName="text-xs"
        end={
          <InputEnd>
            <CopyIconButton text={markdown} className="size-4" />
          </InputEnd>
        }
      />

      <ExternalLink openInNewTab href={deployUrl}>
        <img src="https://www.koyeb.com/static/images/deploy/button.svg" className="h-8" />
      </ExternalLink>
    </div>
  );
}
