import { Floating, IconButton, Spinner } from '@koyeb/design-system';
import clsx from 'clsx';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedTime } from 'react-intl';

import { LogLine } from 'src/api/model';
import { downloadFileFromString } from 'src/application/download-file-from-string';
import { notify } from 'src/application/notify';
import { IconCopy, IconDownload, IconEllipsis } from 'src/components/icons';
import { useClipboard } from 'src/hooks/clipboard';
import { useIntersectionObserver } from 'src/hooks/intersection-observer';
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
    <footer className="row flex-wrap items-center justify-end gap-4">
      <button type="button" className="row items-center gap-2 text-link" onClick={downloadLogs}>
        <IconDownload className="size-em" />
        <T id="download" />
      </button>

      <button type="button" className="row items-center gap-2 text-link" onClick={copyLogs}>
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
  filterLine?: (line: LogLine) => boolean;
  renderLine: (line: LogLine, options: LogOptions) => React.ReactNode;
  renderNoLogs: () => React.ReactNode;
};

export function LogLines({ options, setOption, logs, filterLine, renderLine, renderNoLogs }: LogLinesProps) {
  const lines = logs.lines.filter(filterLine ?? (() => true));
  const container = useRef<HTMLDivElement>(null);
  const [before, setBefore] = useState<HTMLDivElement | null>(null);
  const [after, setAfter] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (options.tail) {
      container.current?.scrollTo({ top: container.current.scrollHeight });
    }
  }, [options.tail, lines]);

  useIntersectionObserver(
    before,
    { root: container.current },
    ([entry]) => entry?.isIntersecting && logs.hasPrevious && logs.loadPrevious(),
    [before, logs.hasPrevious],
  );

  useIntersectionObserver(
    after,
    { root: container.current },
    ([entry]) => setOption('tail', Boolean(entry?.isIntersecting)),
    [after],
  );

  const lastScrollHeight = useRef<number>(null);

  useEffect(() => {
    if (lastScrollHeight.current !== null && container.current?.scrollTop === 0) {
      container.current.scrollTo({ top: container.current.scrollHeight - lastScrollHeight.current });
      lastScrollHeight.current = null;
    }
  }, [lines]);

  const loaderRef = useCallback((elem: HTMLDivElement | null) => {
    elem?.scrollIntoView({ block: 'nearest' });
    lastScrollHeight.current = container.current?.scrollHeight ?? null;
  }, []);

  return (
    <div
      ref={container}
      className={clsx(
        'scrollbar-thin overflow-auto rounded border py-2 scrollbar-green',
        !options.fullScreen && 'h-[32rem] resize-y',
        options.fullScreen && 'flex-1',
      )}
    >
      {lines.length === 0 && (
        <div className="col h-full items-center justify-center gap-2 py-12">{renderNoLogs()}</div>
      )}

      {lines.length > 0 && (
        <>
          <div ref={setBefore} />

          {logs.fetching && (
            <div ref={loaderRef} className="row justify-center">
              <Spinner className="mt-1 size-4" />
            </div>
          )}

          <div className="min-w-min font-mono break-all">
            {lines.map((line) => (
              <Fragment key={line.id}>{renderLine(line, options)}</Fragment>
            ))}
          </div>

          <div ref={setAfter} />
        </>
      )}
    </div>
  );
}

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
    <span className={clsx('whitespace-pre select-none', className)} {...props}>
      {children}
      {'  '}
    </span>
  );
}
