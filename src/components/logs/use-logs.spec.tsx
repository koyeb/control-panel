import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API, createApiOrganization, createApiQuotas, getApiQueryKey } from 'src/api';
import { LogLine } from 'src/model';
import { assert } from 'src/utils/assert';
import { createDate } from 'src/utils/date';
import { createFactory } from 'src/utils/factories';

import { useLogs } from './use-logs';

const getAccessToken = () => Promise.resolve('');

vi.mock('@workos-inc/authkit-react', () => ({
  useAuth: () => ({ getAccessToken }),
}));

const createApiLogEntry = createFactory<API.LogEntry>(() => ({
  created_at: createDate(),
  msg: '',
  labels: { stream: 'stdout' } as never,
}));

const params = createFactory<Parameters<typeof useLogs>[0]>(() => ({
  type: 'build',
  tail: false,
  ansiMode: 'strip',
}));

describe('useLogs', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <Suspense>{children}</Suspense>
      </QueryClientProvider>
    );
  };

  function setOrganization(organization: API.Organization) {
    queryClient.setQueryData(getApiQueryKey('get /v1/account/organization', {}), { organization });
  }

  function setQuotas(organizationId: string, quotas: API.Quotas) {
    queryClient.setQueryData(
      getApiQueryKey('get /v1/organizations/{organization_id}/quotas', {
        path: { organization_id: organizationId },
      }),
      { quotas },
    );
  }

  let logEntries: API.LogEntry[] = [];

  const fetch = vi.fn<typeof window.fetch>(async (url) => {
    assert(url instanceof URL);

    if (url.pathname === '/v1/streams/logs/query') {
      const pagination = {
        next_start: '',
        next_end: '',
        has_more: true,
      };

      return new Response(JSON.stringify({ data: logEntries, pagination }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    throw new Error(`No mock for ${url}`);
  });

  window.fetch = fetch;

  beforeEach(() => {
    queryClient.clear();

    setOrganization(createApiOrganization({ id: 'organizationId' }));
    setQuotas('organizationId', createApiQuotas({}));

    fetch.mockReset();
    logEntries = [];
  });

  it('fetches the logs history', async () => {
    logEntries = [
      createApiLogEntry({
        created_at: createDate('2020-01-01'),
        labels: { stream: 'koyeb' } as never,
        msg: 'Some event',
      }),
      createApiLogEntry({
        created_at: createDate('2020-01-02'),
        labels: { stream: 'stdout', instance_id: 'instanceId' } as never,
        msg: 'Some log line',
      }),
    ];

    const { result } = renderHook(() => useLogs(params()), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current).toHaveProperty<LogLine[]>('lines', [
      {
        id: createDate('2020-01-02'),
        date: createDate('2020-01-02'),
        stream: 'stdout',
        instanceId: 'instanceId',
        text: 'Some log line',
        html: 'Some log line',
      },
      {
        id: createDate('2020-01-01'),
        date: createDate('2020-01-01'),
        stream: 'koyeb',
        text: 'Some event',
        html: 'Some event',
      },
    ]);
  });

  it('fetches the previous page of the logs history', async () => {
    logEntries = [createApiLogEntry({ msg: 'Line 1' }), createApiLogEntry({ msg: 'Line 2' })];

    const { result } = renderHook(() => useLogs(params()), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    logEntries = [createApiLogEntry({ msg: 'Line 3' })];

    await act(() => result.current.loadPrevious());
    await waitFor(() => expect(result.current.fetching).toBe(false));

    expect(result.current).toHaveProperty<LogLine[]>('lines', [
      expect.objectContaining<Partial<LogLine>>({ text: 'Line 3' }),
      expect.objectContaining<Partial<LogLine>>({ text: 'Line 2' }),
      expect.objectContaining<Partial<LogLine>>({ text: 'Line 1' }),
    ]);
  });

  it('connects to the logs stream', async () => {
    const server = new MockWebSocketServer();
    window.WebSocket = MockWebSocket;

    const { result } = renderHook(() => useLogs(params({ tail: true })), { wrapper });

    await waitFor(() => expect(result.current.stream).toEqual('connected'));

    act(() => server.send({ result: createApiLogEntry({ msg: 'Line 1' }) }));

    expect(result.current).toHaveProperty<LogLine[]>('lines', [
      expect.objectContaining<Partial<LogLine>>({ text: 'Line 1' }),
    ]);
  });

  it('strips ANSI codes', async () => {
    const server = new MockWebSocketServer();
    window.WebSocket = MockWebSocket;

    logEntries = [createApiLogEntry({ msg: '\u001b[31mRed text' })];

    const { result } = renderHook(() => useLogs(params({ tail: true, ansiMode: 'strip' })), { wrapper });

    await waitFor(() => expect(result.current.stream).toEqual('connected'));

    act(() => server.send({ result: createApiLogEntry({ msg: 'Still red' }) }));
    act(() => server.send({ result: createApiLogEntry({ msg: '\u001b[0mNow default' }) }));

    expect(result.current.lines.map((line) => line.html)).toEqual(['Red text', 'Still red', 'Now default']);
  });

  it('interprets ANSI codes', async () => {
    const server = new MockWebSocketServer();
    window.WebSocket = MockWebSocket;

    logEntries = [createApiLogEntry({ msg: '\u001b[31mRed text' })];

    const { result } = renderHook(() => useLogs(params({ tail: true, ansiMode: 'interpret' })), { wrapper });

    await waitFor(() => expect(result.current.stream).toEqual('connected'));

    act(() => server.send({ result: createApiLogEntry({ msg: 'Still red' }) }));
    act(() => server.send({ result: createApiLogEntry({ msg: '\u001b[0mNow default' }) }));

    expect(result.current.lines.map((line) => line.html)).toEqual([
      '<span style="color:rgb(187,0,0)">Red text</span>',
      '<span style="color:rgb(187,0,0)">Still red</span>',
      'Now default',
    ]);
  });

  it('keeps the logs history when not tailing anymore', async () => {
    const server = new MockWebSocketServer();
    window.WebSocket = MockWebSocket;

    logEntries = [createApiLogEntry({ msg: 'Line 1' })];

    const { result, rerender } = renderHook((tail: boolean = true) => useLogs(params({ tail })), { wrapper });

    await waitFor(() => expect(result.current.stream).toEqual('connected'));

    act(() => server.send({ result: createApiLogEntry({ msg: 'Line 2' }) }));

    logEntries = [createApiLogEntry({ msg: 'Line 1' }), createApiLogEntry({ msg: 'Line 2' })];

    rerender(false);

    await waitFor(() => expect(result.current.stream).toEqual('disconnected'));
    await waitFor(() => expect(result.current.lines).toHaveLength(2));
  });

  it('returns an error when fetching the logs history failed', async () => {
    const error = Response.error();

    fetch.mockImplementation(() => {
      throw error.clone();
    });

    const { result } = renderHook(() => useLogs(params()), { wrapper });

    await waitFor(() => expect(result.current.error).toEqual(error));
  });

  it('returns an error when the log stream fails', async () => {
    const server = new MockWebSocketServer();
    window.WebSocket = MockWebSocket;

    const { result } = renderHook(() => useLogs(params({ tail: true })), { wrapper });

    await waitFor(() => expect(result.current.stream).toEqual('connected'));
    act(() => server.error());

    await waitFor(() => expect(result.current.error).toHaveProperty('message', 'WebSocket error'));
  });
});

class MockWebSocketServer {
  sockets: MockWebSocket[] = [];

  constructor() {
    MockWebSocket.server = this;
  }

  send(message: unknown) {
    this.sockets.forEach((socket) =>
      socket.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(message) })),
    );
  }

  error(error = new ErrorEvent('error')) {
    this.sockets.forEach((socket) => socket.dispatchEvent(error));
  }
}

class MockWebSocket extends EventTarget implements WebSocket {
  static server?: MockWebSocketServer;

  static CONNECTING = WebSocket.CONNECTING;
  CONNECTING = WebSocket.CONNECTING;

  static OPEN = WebSocket.OPEN;
  OPEN = WebSocket.OPEN;

  static CLOSING = WebSocket.CLOSING;
  CLOSING = WebSocket.CLOSING;

  static CLOSED = WebSocket.CLOSED;
  CLOSED = WebSocket.CLOSED;

  protocol = '';
  url = '';
  bufferedAmount = 0;
  extensions = '';
  binaryType: BinaryType = 'blob';
  readyState = WebSocket.CONNECTING;

  constructor(url: string | URL, protocols: string | string[] = []) {
    super();

    this.url = url.toString();
    this.protocol = protocols instanceof Array ? protocols[0] || '' : protocols;

    MockWebSocket.server?.sockets.push(this);

    setTimeout(() => this.dispatchEvent(new Event('open')), 0);
  }

  onopen = () => {};
  onclose = () => {};
  onerror = () => {};
  onmessage = () => {};
  send = () => {};
  close = () => {};
}
