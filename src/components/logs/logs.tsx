import clsx from 'clsx';
import IconCopy from 'lucide-static/icons/copy.svg?react';
import IconDownload from 'lucide-static/icons/download.svg?react';
import IconEllipsis from 'lucide-static/icons/ellipsis.svg?react';
import IconFullscreen from 'lucide-static/icons/fullscreen.svg?react';
import { useEffect, useRef, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { UseFormReturn, useForm } from 'react-hook-form';
import { FormattedTime } from 'react-intl';

import { IconButton, Floating, Menu, MenuItem, useBreakpoint } from '@koyeb/design-system';
import { LogLine } from 'src/api/model';
import { downloadFileFromString } from 'src/application/download-file-from-string';
import { notify } from 'src/application/notify';
import { useClipboard } from 'src/hooks/clipboard';
import { useShortcut } from 'src/hooks/shortcut';
import { Translate } from 'src/intl/translate';
import { shortId } from 'src/utils/strings';

import { ControlledCheckbox } from '../controlled';

const T = Translate.prefix('logs');

export type LogOptions = {
  fullScreen: boolean;
  tail: boolean;
  stream: boolean;
  date: boolean;
  wordWrap: boolean;
};

type LogsProps = {
  appName: string;
  serviceName: string;
  expired?: boolean;
  hasFilters?: boolean;
  header?: React.ReactNode;
  lines: LogLine[];
  renderLine: (line: LogLine, options: LogOptions) => React.ReactNode;
};

export function Logs({ appName, serviceName, expired, hasFilters, header, lines, renderLine }: LogsProps) {
  const isMobile = !useBreakpoint('md');

  const form = useForm<LogOptions>({
    defaultValues: {
      fullScreen: false,
      tail: true,
      stream: !isMobile,
      date: !isMobile,
      wordWrap: false,
    },
  });

  return (
    <section
      className={clsx(
        'col divide-y bg-neutral',
        form.watch('fullScreen') ? 'fixed inset-0 z-50' : 'rounded-lg border',
      )}
    >
      <LogsHeader expired={expired} header={header} form={form} />

      <div className="flex-1 overflow-hidden">
        <LogLines
          expired={expired}
          hasFilters={hasFilters}
          options={form.watch()}
          setOption={form.setValue}
          lines={lines}
          renderLine={renderLine}
        />
      </div>

      <LogsFooter appName={appName} serviceName={serviceName} expired={expired} lines={lines} form={form} />
    </section>
  );
}

type LogsHeaderProps = {
  expired?: boolean;
  header?: React.ReactNode;
  form: UseFormReturn<LogOptions>;
};

function LogsHeader({ expired, header, form }: LogsHeaderProps) {
  const toggleFullScreen = useFullScreen(form);
  const isDesktop = useBreakpoint('md');

  const fullScreenButton = !expired && (
    <IconButton variant="solid" Icon={IconFullscreen} onClick={toggleFullScreen} className="sm:self-start">
      <T id="fullScreen" />
    </IconButton>
  );

  if (form.watch('fullScreen') && !isDesktop) {
    return <div className="absolute right-0 top-0 m-4">{fullScreenButton}</div>;
  }

  return (
    <header className="col lg:row gap-4 p-4 lg:items-center">
      <div className="mr-auto font-medium">
        <T id="title" />
      </div>

      {!expired && header}

      {fullScreenButton}
    </header>
  );
}

type LogsFooterProps = {
  appName: string;
  serviceName: string;
  expired?: boolean;
  lines: LogLine[];
  form: UseFormReturn<LogOptions>;
};

function LogsFooter({ appName, serviceName, expired, lines, form }: LogsFooterProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const downloadLogs = useDownloadLogs(appName, serviceName, lines);
  const copyLogs = useCopyLogs(lines);

  if (expired) {
    return null;
  }

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
        renderReference={(ref, props) => (
          <div ref={ref}>
            <IconButton
              variant="ghost"
              color="gray"
              Icon={IconEllipsis}
              onClick={() => setMenuOpen(true)}
              {...props}
            />
          </div>
        )}
        renderFloating={(ref, props) => (
          <Menu ref={ref} {...props}>
            {(['tail', 'stream', 'date', 'wordWrap'] as const).map((option) => (
              <MenuItem key={option}>
                <ControlledCheckbox
                  control={form.control}
                  name={option}
                  label={<T id={option} />}
                  className="flex-1"
                />
              </MenuItem>
            ))}
          </Menu>
        )}
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

function useFullScreen(form: UseFormReturn<LogOptions>) {
  useShortcut(['escape'], () => {
    if (form.getValues('fullScreen')) {
      form.setValue('fullScreen', false);
    }
  });

  useEffect(() => {
    const { unsubscribe } = form.watch((values) => {
      if (values.fullScreen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    return unsubscribe;
  });

  return () => {
    form.setValue('fullScreen', !form.getValues('fullScreen'));
  };
}

type LogLinesProps = {
  expired?: boolean;
  hasFilters?: boolean;
  options: LogOptions;
  setOption: (option: keyof LogOptions, value: boolean) => void;
  lines: LogLine[];
  renderLine: (line: LogLine, options: LogOptions) => React.ReactNode;
};

function LogLines({ expired, hasFilters, options, setOption, lines, renderLine }: LogLinesProps) {
  const container = useRef<HTMLDivElement>(null);
  const ignoreNextScrollEventRef = useRef(false);

  useEffect(() => {
    if (container.current && options.tail) {
      container.current.scrollTop = container.current.scrollHeight;
      ignoreNextScrollEventRef.current = true;
    }
  }, [lines, options.fullScreen, options.tail]);

  const onScroll = () => {
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
      )}
      // set height with style to clear the one set manually when resizing
      style={{ height: options.fullScreen ? '100%' : undefined }}
    >
      {lines.length === 0 && <NoLogs expired={expired} hasFilters={hasFilters} />}

      <div className="min-w-min font-mono">
        {lines.map((line, index) => (
          <Fragment key={index}>{renderLine(line, options)}</Fragment>
        ))}
      </div>
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

type NoLogsFallbackProps = {
  expired?: boolean;
  hasFilters?: boolean;
};

function NoLogs({ expired, hasFilters }: NoLogsFallbackProps) {
  const prefix = ((hasFilters) => {
    if (expired) return 'logsExpired' as const;
    if (hasFilters) return 'logsFiltered' as const;
    return 'noLogs' as const;
  })(hasFilters);

  return (
    <div className="col h-full items-center justify-center gap-2 py-12">
      <p className="font-medium">
        <T id={`${prefix}.title`} />
      </p>
      <p className="max-w-xl text-center">
        <T id={`${prefix}.description`} />
      </p>
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
    <span className={clsx('select-none whitespace-pre', className)} {...props}>
      {children}
      {'  '}
    </span>
  );
}
