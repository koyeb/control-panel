import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { FormattedTime } from 'react-intl';

import { Floating, IconButton, Spinner } from '@koyeb/design-system';
import { LogLine } from 'src/api/model';
import { downloadFileFromString } from 'src/application/download-file-from-string';
import { notify } from 'src/application/notify';
import { IconCopy, IconDownload, IconEllipsis } from 'src/components/icons';
import { useClipboard } from 'src/hooks/clipboard';
import { LogsApi } from 'src/hooks/logs';
import { createTranslate } from 'src/intl/translate';
import { shortId } from 'src/utils/strings';

import { LogOptions } from './log-options';

export { type LogOptions };

const T = createTranslate('components.logs');

type LogsFooterProps = {
  appName: string;
  serviceName: string;
  lines: LogLine[];
  renderMenu: (props: Record<string, unknown>) => React.ReactNode;
};

export function LogsFooter({ appName, serviceName, lines, renderMenu }: LogsFooterProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const downloadLogs = useDownloadLogs(appName, serviceName, lines);
  const copyLogs = useCopyLogs(lines);

  return (
    <footer className="row flex-wrap items-center justify-end gap-4 px-4 py-2">
      <button type="button" className="text-link row items-center gap-2" onClick={downloadLogs}>
        <IconDownload className="size-em" />
        <T id="download" />
      </button>

      <button type="button" className="text-link row items-center gap-2" onClick={copyLogs}>
        <IconCopy className="size-em" />
        <T id="copy" />
      </button>

      <Floating
        open={menuOpen}
        setOpen={setMenuOpen}
        placement="bottom-start"
        renderReference={(props) => (
          <div>
            <IconButton
              variant="ghost"
              color="gray"
              Icon={IconEllipsis}
              onClick={() => setMenuOpen(!menuOpen)}
              {...props}
            />
          </div>
        )}
        renderFloating={renderMenu}
      />
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

type LogLinesProps = {
  options: LogOptions;
  setOption: (option: keyof LogOptions, value: boolean) => void;
  logs: LogsApi;
  renderLine: (line: LogLine, options: LogOptions) => React.ReactNode;
  renderNoLogs: () => React.ReactNode;
};

export function LogLines({ options, setOption, logs, renderLine, renderNoLogs }: LogLinesProps) {
  const { lines } = logs;
  const container = useRef<HTMLDivElement>(null);
  const ignoreNextScrollEventRef = useRef(false);

  useEffect(() => {
    if (container.current && options.tail) {
      container.current.scrollTop = container.current.scrollHeight;
      ignoreNextScrollEventRef.current = true;
    }
  }, [lines, options.fullScreen, options.tail]);

  const prevHeight = useRef<number>(null);

  useEffect(() => {
    if (prevHeight.current && container.current?.scrollTop === 0) {
      container.current.scrollTop = container.current.scrollHeight - prevHeight.current;
    }
  }, [lines]);

  const onScroll = () => {
    if (container.current) {
      prevHeight.current = container.current.scrollHeight;

      if (container.current.scrollTop < 100 && logs.hasPrevious && !logs.loading) {
        logs.loadPrevious();
      }
    }

    if (ignoreNextScrollEventRef.current === true) {
      ignoreNextScrollEventRef.current = false;
      return;
    }

    if (isScrollable(container.current)) {
      setOption('tail', hasReachedEnd(container.current));
    }
  };

  return (
    <div
      ref={container}
      onScroll={onScroll}
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      className={clsx(
        'scrollbar-green scrollbar-thin overflow-auto py-2',
        !options.fullScreen && 'h-[32rem] resize-y',
        options.fullScreen && 'h-full',
      )}
    >
      {lines.length === 0 && (
        <div className="col h-full items-center justify-center gap-2 py-12">{renderNoLogs()}</div>
      )}

      {logs.lines.length > 0 && logs.fetching && (
        <div className="row justify-center">
          <Spinner className="size-4" />
        </div>
      )}

      {logs.lines.length > 0 && (
        <div className="min-w-min break-all font-mono">
          {lines.map((line) => (
            <Fragment key={line.id}>{renderLine(line, options)}</Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

const isScrollable = (element: HTMLElement | null) => {
  if (!element) {
    return false;
  }

  return element.scrollHeight > element.clientHeight;
};

const hasReachedEnd = (element: HTMLElement | null) => {
  if (!element) {
    return false;
  }

  return element.scrollTop + element.clientHeight >= element.scrollHeight;
};

type LogLineDateProps = { line: LogLine } & Omit<React.ComponentProps<typeof FormattedTime>, 'value'>;

export function LogLineDate({ line, ...props }: LogLineDateProps) {
  return (
    <LogLineMeta className="text-dim">
      <FormattedTime value={line.date} {...props} />
    </LogLineMeta>
  );
}

export function LogLineStream({ line }: { line: LogLine }) {
  return (
    <LogLineMeta className={clsx(line.stream === 'stderr' && 'text-red')}>
      {(line.stream === 'koyeb' ? 'event' : line.stream).padEnd(6, ' ')}
    </LogLineMeta>
  );
}

export function LogLineInstanceId({ line }: { line: LogLine }) {
  return <LogLineMeta>{shortId(line.instanceId)}</LogLineMeta>;
}

export function LogLineContent({ line, options }: { line: LogLine; options: LogOptions }) {
  return (
    <span
      className={clsx(options.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre')}
      dangerouslySetInnerHTML={{ __html: line.html }}
    />
  );
}

function LogLineMeta({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={clsx('select-none whitespace-pre', className)} {...props}>
      {children}
      {'  '}
    </span>
  );
}
