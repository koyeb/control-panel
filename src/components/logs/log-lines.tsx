import { Spinner } from '@koyeb/design-system';
import clsx from 'clsx';
import React, { useLayoutEffect, useRef } from 'react';
import { FormattedDate } from 'react-intl';

import { useIntersectionObserver, useResizeObserver } from 'src/hooks/observers';
import { LogLine as LogLineType } from 'src/model';
import { shortId } from 'src/utils/strings';

type LogsLinesProps = {
  lines: LogLineType[];
  tail?: boolean;
  hasPrevious?: boolean;
  renderLine: (line: LogLineType) => React.ReactNode;
  onWheel?: React.WheelEventHandler<HTMLDivElement>;
  onScrollToTop?: () => void;
  onScrollToBottom?: () => void;
  className?: string;
};

export function LogsLines({
  lines,
  tail,
  hasPrevious,
  renderLine,
  onWheel,
  onScrollToTop,
  onScrollToBottom,
  className,
}: LogsLinesProps) {
  const scrollingContainer = useRef<HTMLDivElement>(null);
  const scrollHeight = useRef<number>(null);

  const resizableContainer = useResizeObserver(
    () => {
      if (scrollingContainer.current === null) {
        return;
      }

      scrollHeight.current = scrollingContainer.current.scrollHeight;

      if (tail) {
        scrollingContainer.current.scrollTo({ top: scrollHeight.current });
      }
    },
    undefined,
    [tail],
  );

  const before = useIntersectionObserver(
    ([entry]) => entry?.isIntersecting && onScrollToTop?.(),
    { root: scrollingContainer.current },
    [],
  );

  const after = useIntersectionObserver(
    ([entry]) => entry?.isIntersecting && onScrollToBottom?.(),
    { root: scrollingContainer.current },
    [],
  );

  useLayoutEffect(() => {
    if (scrollingContainer.current?.scrollTop === 0 && scrollHeight.current !== null) {
      scrollingContainer.current.scrollTo({
        top: scrollingContainer.current.scrollHeight - scrollHeight.current,
      });
    }
  }, [lines]);

  return (
    <div
      ref={scrollingContainer}
      onWheel={onWheel}
      className={clsx(
        'scrollbar-thin overflow-auto rounded-md border py-2 font-mono scrollbar-green',
        className,
      )}
    >
      {hasPrevious && (
        <div className="row justify-center pb-2">
          <Spinner className="size-4" />
        </div>
      )}

      <div ref={before} />

      <div ref={resizableContainer}>
        {lines.map((line) => (
          <React.Fragment key={line.id}>{renderLine(line)}</React.Fragment>
        ))}
      </div>

      <div ref={after} />
    </div>
  );
}

type LogLineProps = {
  line: LogLineType;
  showDate?: boolean;
  dateFormat?: Intl.DateTimeFormatOptions;
  showStream?: boolean;
  showInstanceId?: boolean;
  wordWrap?: boolean;
};

export function LogLine({ line, showDate, dateFormat, showStream, showInstanceId, wordWrap }: LogLineProps) {
  return (
    <div className={clsx('row gap-4 px-2', { 'bg-blue/10': line.stream === 'koyeb' })}>
      <LogLineDate line={line} hidden={!showDate} options={dateFormat} />
      <LogLineStream line={line} hidden={!showStream} />
      <LogLineInstanceId line={line} hidden={!showInstanceId} />
      <LogLineContent line={line} wordWrap={wordWrap} />
    </div>
  );
}

type LogLineDateProps = {
  line: LogLineType;
  hidden: boolean;
  options?: Intl.DateTimeFormatOptions;
};

function LogLineDate({ line, hidden, options }: LogLineDateProps) {
  return (
    <LogLineMeta hidden={hidden} className="text-dim">
      <FormattedDate value={line.date} timeZone="UTC" {...options} />
    </LogLineMeta>
  );
}

type LogLineStreamProps = {
  line: LogLineType;
  hidden: boolean;
};

function LogLineStream({ line, hidden }: LogLineStreamProps) {
  return <LogLineMeta hidden={hidden}>{line.stream.padEnd(6, ' ')}</LogLineMeta>;
}

type LogLineInstanceIdProps = {
  line: LogLineType;
  hidden: boolean;
};

function LogLineInstanceId({ line, hidden }: LogLineInstanceIdProps) {
  return <LogLineMeta hidden={hidden}>{shortId(line.instanceId)}</LogLineMeta>;
}

type LogLineMetaProps = {
  hidden: boolean;
  className?: string;
  children: React.ReactNode;
};

function LogLineMeta({ hidden, className, children }: LogLineMetaProps) {
  return <pre className={clsx('select-none', { hidden }, className)}>{children}</pre>;
}

type LogLineContentProps = {
  line: LogLineType;
  wordWrap?: boolean;
};

function LogLineContent({ line, wordWrap }: LogLineContentProps) {
  return (
    <pre
      dangerouslySetInnerHTML={{ __html: line.html || '&nbsp;' }}
      className={clsx('flex-1', { 'whitespace-pre-wrap': wordWrap })}
    />
  );
}
