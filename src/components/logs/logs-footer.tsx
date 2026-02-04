import { downloadFileFromString } from 'src/application/download-file-from-string';
import { notify } from 'src/application/notify';
import { useClipboard } from 'src/hooks/clipboard';
import { IconCopy, IconDownload, IconEllipsis } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { LogLine } from 'src/model';

import { ActionsMenu } from '../dropdown-menu';

const T = createTranslate('components.logs');

type LogsFooterProps = {
  appName: string;
  serviceName: string;
  lines: LogLine[];
  menu: React.ReactNode;
};

export function LogsFooter({ appName, serviceName, lines, menu }: LogsFooterProps) {
  const downloadLogs = useDownloadLogs(appName, serviceName, lines);
  const copyLogs = useCopyLogs(lines);

  return (
    <footer className="row flex-wrap items-center justify-end gap-4">
      <button type="button" className="row items-center gap-2 text-link" onClick={downloadLogs}>
        <IconDownload className="size-em" />
        <T id="download" />
      </button>

      <button type="button" className="row items-center gap-2 text-link" onClick={copyLogs}>
        <IconCopy className="size-em" />
        <T id="copy" />
      </button>

      <ActionsMenu
        closeOnClick={false}
        Icon={IconEllipsis}
        dropdown={{ floating: { placement: 'bottom-start' } }}
      >
        {menu}
      </ActionsMenu>
    </footer>
  );
}

function useDownloadLogs(appName: string, serviceName: string, lines: LogLine[]) {
  return () => {
    downloadFileFromString(
      `${appName}-${serviceName}_${new Date().toISOString()}.txt`,
      lines.map((line) => line.text).join('\n'),
    );
  };
}

function useCopyLogs(lines: LogLine[]) {
  const t = T.useTranslate();
  const copy = useClipboard();

  return () => {
    copy(lines.map((line) => line.text).join('\n'), () => notify.info(t('copySuccess')));
  };
}
