import { FitAddon } from '@xterm/addon-fit';
import { ITerminalOptions, Terminal as XTerm } from '@xterm/xterm';
import { useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { useWatchElementSize } from '@koyeb/design-system';
import { useThemeModeOrPreferred } from 'src/hooks/theme';

import '@xterm/xterm/css/xterm.css';

export type TerminalRef = {
  focus(): void;
  clear(): void;
  write(chunk: string): void;
};

type TerminalProps = {
  ref?: React.Ref<TerminalRef>;
  onSizeChange: (size: { cols: number; rows: number }) => void;
  onData: (data: string) => void;
};

export default function Terminal({ ref, onSizeChange, onData }: TerminalProps) {
  const xterm = useMemo(() => new XTerm(), []);
  const fitAddon = useMemo(() => new FitAddon(), []);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => xterm, [xterm]);

  useEffect(() => {
    if (container === null) {
      return;
    }

    xterm.loadAddon(fitAddon);
    xterm.open(container);
    fitAddon.fit();

    onSizeChange({ cols: xterm.cols, rows: xterm.rows });
    xterm.onResize((size) => onSizeChange(size));
  }, [xterm, fitAddon, container, onSizeChange]);

  useEffect(() => {
    const disposable = xterm.onData(onData);

    return () => {
      disposable.dispose();
    };
  }, [xterm, onData]);

  useWatchElementSize(container, () => fitAddon.fit());
  useTerminalTheme(xterm);

  return (
    <div className="rounded border py-2 pl-2">
      <div ref={setContainer} className="h-96 resize-y overflow-hidden" />
    </div>
  );
}

function useTerminalTheme(xterm: XTerm) {
  const themeMode = useThemeModeOrPreferred();

  const theme = useMemo<ITerminalOptions['theme']>(() => {
    void themeMode;

    const styles = getComputedStyle(document.body);

    const body = styles.getPropertyValue('--color-background-neutral');
    const text = styles.getPropertyValue('--color-text-default');
    const muted = styles.getPropertyValue('--color-background-muted');

    return {
      background: `rgb(${body})`,
      foreground: `rgb(${text})`,
      cursor: `rgb(${text})`,
      selectionBackground: `rgb(${muted})`,
    };
  }, [themeMode]);

  useEffect(() => {
    xterm.options.fontFamily = '"JetBrains Mono Variable", monospace';
    xterm.options.fontSize = 12;
    xterm.options.theme = theme;
  }, [xterm, theme]);
}
