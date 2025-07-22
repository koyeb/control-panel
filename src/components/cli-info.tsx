import { Tooltip } from '@koyeb/design-system';

import { CopyIconButton } from 'src/components/copy-icon-button';
import { IconInfo } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { DocumentationLink } from './documentation-link';

const T = createTranslate('components.cliInfo');

type CliInfoButtonProps = {
  button: React.ReactNode;
  tooltip: React.ReactNode;
};

export function CliInfoButton({ button, tooltip }: CliInfoButtonProps) {
  return (
    <div className="col items-end">
      {button}

      <Tooltip allowHover color="neutral" content={tooltip} className="max-w-md">
        {(props) => (
          <button type="button" className="text-xs text-dim/75 underline" {...props}>
            <T id="cta" values={{ icon: <IconInfo className="ml-1 inline-block size-3 align-middle" /> }} />
          </button>
        )}
      </Tooltip>
    </div>
  );
}

type CliInfoTooltipProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  command: string;
};

export function CliInfoTooltip({ title, description, command }: CliInfoTooltipProps) {
  return (
    <div className="col gap-4 p-4 text-sm">
      <div>
        <div className="text-base font-medium">{title}</div>
        <div className="mt-1 text-dim">
          <T id="description" />
        </div>
      </div>

      <div className="row items-center justify-between gap-2 rounded bg-black p-2 font-mono text-white">
        $ {command}
        <div>
          <CopyIconButton text={command} className="size-4" />
        </div>
      </div>

      <div className="text-base font-medium">{description}</div>

      <div className="text-dim">
        <T
          id="install"
          values={{
            link: (children) => (
              <DocumentationLink path="/docs/build-and-deploy/cli/installation">{children}</DocumentationLink>
            ),
          }}
        />
      </div>

      <div className="text-dim">
        <T
          id="reference"
          values={{
            link: (children) => (
              <DocumentationLink path="/docs/build-and-deploy/cli/reference">{children}</DocumentationLink>
            ),
          }}
        />
      </div>
    </div>
  );
}
