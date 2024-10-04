import { describe, expect, it } from 'vitest';

import { identity } from 'src/utils/generic';

import { defaultHealthCheck, defaultServiceForm } from '../initialize-service-form';
import { ServiceForm } from '../service-form.types';

import { serviceFormSchema } from './service-form.schema';

describe('serviceFormSchema', () => {
  const createServiceForm = () => {
    const form = defaultServiceForm();

    form.source.type = 'docker';
    form.source.docker.image = 'image';
    form.appName = 'app';
    form.serviceName = 'service';

    return form;
  };

  const parse = (form: ServiceForm) => {
    const result = serviceFormSchema(identity).safeParse(form);

    if ('error' in result) {
      // eslint-disable-next-line no-console
      console.dir(result.error, { depth: null });
      expect.fail();
    }

    return result.data;
  };

  it('docker image', () => {
    const form = createServiceForm();

    parse(form);
  });

  it('organization repository', () => {
    const form = createServiceForm();

    form.source.type = 'git';
    form.source.git.organizationRepository = {
      id: 'repositoryId',
      repositoryName: 'org/repo',
      branch: 'master',
      autoDeploy: true,
    };

    parse(form);
  });

  it('builder', () => {
    const form = createServiceForm();

    form.builder.type = 'buildpack';
    form.builder.buildpackOptions.buildCommand = 'build';

    expect(parse(form)).toHaveProperty('builder', {
      type: 'buildpack',
      buildpackOptions: {
        buildCommand: 'build',
        runCommand: null,
        privileged: false,
      },
    });
  });

  it('scaling', () => {
    const form = createServiceForm();

    form.scaling.type = 'autoscaling';
    form.scaling.autoscaling.targets.cpu.enabled = true;

    parse(form);
  });

  it('environment variables', () => {
    const form = createServiceForm();

    form.environmentVariables.push({
      name: ' name ',
      type: 'secret',
      value: 'value',
    });

    form.environmentVariables.push({
      name: '',
      type: 'plaintext',
      value: '',
    });

    expect(parse(form)).toHaveProperty('environmentVariables', [
      {
        name: 'name',
        type: 'secret',
        value: 'value',
      },
    ]);
  });

  it('ports', () => {
    const form = createServiceForm();

    form.ports.push({
      portNumber: 1,
      path: '/',
      protocol: 'http',
      public: true,
      healthCheck: defaultHealthCheck(),
    });

    expect(parse(form)).toHaveProperty('ports.1', {
      portNumber: 1,
      path: '/',
      protocol: 'http',
      public: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      healthCheck: expect.any(Object),
    });
  });

  it('http health check', () => {
    const form = createServiceForm();

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

    expect(parse(form)).toHaveProperty('ports.0.healthCheck', {
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

  it('trims whitespace on app and service names', () => {
    const form = createServiceForm();

    form.appName = ' app ';
    form.serviceName = ' service ';

    expect(serviceFormSchema(identity).parse(form)).toMatchObject({
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
