import { beforeEach, describe, expect, it } from 'vitest';

import { Organization, OrganizationQuotas } from 'src/api/model';
import { create } from 'src/utils/factories';

import { Port, ServiceForm } from '../service-form.types';

import { defaultHealthCheck, defaultServiceForm } from './initialize-service-form';
import { serviceFormSchema } from './service-form.schema';

describe('serviceFormSchema', () => {
  let organization: Organization;
  let quotas: OrganizationQuotas;
  let form: ServiceForm;

  beforeEach(() => {
    organization = create.organization();

    quotas = create.quotas();
    quotas.scaleToZero.lightSleepIdleDelayMin = 60;
    quotas.scaleToZero.lightSleepIdleDelayMax = 3600;
    quotas.scaleToZero.deepSleepIdleDelayMin = 300;
    quotas.scaleToZero.deepSleepIdleDelayMax = 7200;

    form = defaultServiceForm();
    form.source.type = 'docker';
    form.source.docker.image = 'image';
    form.appName = 'app';
    form.serviceName = 'service';
  });

  const parse = () => {
    const result = serviceFormSchema(organization, quotas).safeParse(form);

    expect(result.success, JSON.stringify(result.error, null, 2)).toBe(true);

    return result.data;
  };

  it('docker image', () => {
    parse();
  });

  it('organization repository', () => {
    form.source.type = 'git';
    form.source.git.organizationRepository = {
      id: 'repositoryId',
      repositoryName: 'org/repo',
      branch: 'master',
      autoDeploy: true,
    };

    parse();
  });

  it('builder', () => {
    form.builder.type = 'buildpack';
    form.builder.buildpackOptions.buildCommand = 'build';

    expect(parse()).toHaveProperty('builder', {
      type: 'buildpack',
      buildpackOptions: {
        buildCommand: 'build',
        runCommand: null,
        privileged: false,
      },
    });
  });

  it('scaling', () => {
    form.scaling.min = 1;
    form.scaling.max = 2;
    form.scaling.targets.cpu.enabled = true;

    parse();
  });

  it('scale to zero', () => {
    form.scaling.min = 0;
    form.scaling.max = 1;

    form.scaling.scaleToZero.idlePeriod = 300;
    form.scaling.scaleToZero.lightToDeepPeriod = 240;
    form.scaling.scaleToZero.lightSleepEnabled = false;
    parse();

    form.scaling.scaleToZero.lightSleepEnabled = true;
    parse();

    form.scaling.scaleToZero.idlePeriod = 0;
    expect(() => parse()).toThrowError('Number must be greater than or equal to 60');

    form.scaling.scaleToZero.idlePeriod = 1e10;
    expect(() => parse()).toThrowError('Number must be less than or equal to 3600');

    form.scaling.scaleToZero.idlePeriod = 60;
    form.scaling.scaleToZero.lightToDeepPeriod = 0;
    expect(() => parse()).toThrowError('Number must be greater than or equal to 240');

    form.scaling.scaleToZero.lightToDeepPeriod = 1e10;
    expect(() => parse()).toThrowError('Number must be less than or equal to 7140');

    form.scaling.scaleToZero.idlePeriod = 70;
    expect(() => parse()).toThrowError('Number must be less than or equal to 7130');
  });

  it('scale to zero on the hobby plan', () => {
    organization.plan = 'hobby';

    quotas.scaleToZero.deepSleepIdleDelayMin = 0;
    quotas.scaleToZero.deepSleepIdleDelayMax = 0;

    form.scaling.scaleToZero.idlePeriod = 300;

    parse();
  });

  it('environment variables', () => {
    form.environmentVariables.push({
      name: ' name ',
      value: 'value',
      regions: [],
    });

    form.environmentVariables.push({
      name: '',
      value: '',
      regions: [],
    });

    expect(parse()).toHaveProperty('environmentVariables', [
      {
        name: 'name',
        value: 'value',
        regions: [],
      },
    ]);
  });

  it('removes empty files', () => {
    form.files = [{ mountPath: '', permissions: '', content: '' }];

    expect(parse()).toHaveProperty('files', []);
  });

  it('ports', () => {
    form.ports.push({
      portNumber: 1,
      path: '/',
      protocol: 'http',
      public: true,
      tcpProxy: false,
      healthCheck: defaultHealthCheck(),
    });

    expect(parse()).toHaveProperty<Port>('ports.1', {
      portNumber: 1,
      path: '/',
      protocol: 'http',
      public: true,
      tcpProxy: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      healthCheck: expect.any(Object),
    });
  });

  it('http health check', () => {
    form.ports[0]!.healthCheck = {
      protocol: 'http',
      gracePeriod: 5,
      interval: 30,
      restartLimit: 3,
      timeout: 5,
      path: '/',
      method: 'head',
      headers: [{ name: 'key', value: 'value' }],
    };

    expect(parse()).toHaveProperty('ports.0.healthCheck', {
      protocol: 'http',
      gracePeriod: 5,
      interval: 30,
      restartLimit: 3,
      timeout: 5,
      path: '/',
      method: 'head',
      headers: [{ name: 'key', value: 'value' }],
    });
  });

  it('removes empty volumes', () => {
    form.volumes = [{ name: '', mountPath: '', size: 0, mounted: false }];

    expect(parse()).toHaveProperty('volumes', []);
  });

  it('trims whitespace on app and service names', () => {
    form.appName = ' app ';
    form.serviceName = ' service ';

    expect(serviceFormSchema(organization, quotas).parse(form)).toMatchObject({
      appName: 'app',
      serviceName: 'service',
    });
  });

  // it('schema type', () => {
  //   type SchemaType = z.infer<ReturnType<typeof serviceFormSchema>>;
  //   type FormType = Omit<ServiceForm, 'meta'>;

  //   expectTypeOf<FormType>().toMatchTypeOf<SchemaType>();
  // });
});
