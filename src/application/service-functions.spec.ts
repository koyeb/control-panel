import { beforeEach, describe, expect, it } from 'vitest';

import { TOKENS } from 'src/tokens';
import { create } from 'src/utils/factories';

import { StubConfigAdapter } from './config';
import { container } from './container';
import { ServiceUrl, getServiceUrls } from './service-functions';

describe('getServiceUrls', () => {
  const config = new StubConfigAdapter();

  beforeEach(() => {
    container.bindValue(TOKENS.config, config);
  });

  it('web service urls', () => {
    const urls = getServiceUrls(
      create.app({ name: 'app', domains: [{ id: '', name: 'test.com', type: 'CUSTOM' }] }),
      create.service({ name: 'svc', type: 'web' }),
      create.computeDeployment({
        definition: create.deploymentDefinition({
          ports: [
            { portNumber: 8000, protocol: 'http', path: '/' },
            { portNumber: 8001, protocol: 'http', path: '/path' },
          ],
        }),
      }),
    );

    expect(urls).toEqual<ServiceUrl[]>([
      { portNumber: 8000, externalUrl: 'test.com/', internalUrl: 'svc.app.internal:8000' },
      { portNumber: 8001, externalUrl: 'test.com/path', internalUrl: 'svc.app.internal:8001' },
    ]);
  });

  it('free instance has no private address', () => {
    const urls = getServiceUrls(
      create.app({ name: 'app', domains: [{ id: '', name: 'test.com', type: 'CUSTOM' }] }),
      create.service({ name: 'svc', type: 'web' }),
      create.computeDeployment({
        definition: create.deploymentDefinition({
          instanceType: 'free',
          ports: [{ portNumber: 8000, protocol: 'http', path: '/' }],
        }),
      }),
    );

    expect(urls).toEqual<ServiceUrl[]>([{ portNumber: 8000, externalUrl: 'test.com/' }]);
  });

  it('private port', () => {
    const urls = getServiceUrls(
      create.app({ name: 'app', domains: [{ id: '', name: 'app.koyeb.app', type: 'AUTOASSIGNED' }] }),
      create.service({ name: 'svc', type: 'web' }),
      create.computeDeployment({
        definition: create.deploymentDefinition({
          ports: [{ portNumber: 8000, protocol: 'tcp' }],
        }),
      }),
    );

    expect(urls).toEqual<ServiceUrl[]>([{ portNumber: 8000, internalUrl: 'svc.app.internal:8000' }]);
  });

  it('tcp proxy', () => {
    config.set('environment', 'production');

    const urls = getServiceUrls(
      create.app({ domains: [{ id: '', name: 'app.koyeb.app', type: 'AUTOASSIGNED' }] }),
      create.service(),
      create.computeDeployment({
        definition: create.deploymentDefinition({
          ports: [{ portNumber: 8000, protocol: 'tcp', tcpProxy: true }],
        }),
        proxyPorts: [{ port: 8000, publicPort: 12345, host: 'some-domain.koyeb.app' }],
      }),
    );

    expect(urls).toEqual<ServiceUrl[]>([
      {
        portNumber: 8000,
        internalUrl: expect.anything() as string,
        tcpProxyUrl: 'some-domain.koyeb.app:12345',
      },
    ]);
  });

  it('database host', () => {
    const urls = getServiceUrls(
      create.app(),
      create.service({ type: 'database' }),
      create.databaseDeployment({
        host: 'test.koyeb.app',
      }),
    );

    expect(urls).toEqual<ServiceUrl[]>([{ portNumber: 5432, internalUrl: 'test.koyeb.app' }]);
  });
});
