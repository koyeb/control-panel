import { beforeEach, describe, expect, it } from 'vitest';

import { CatalogInstance, CatalogRegion } from 'src/api/model';
import { create } from 'src/utils/factories';

import { defaultHealthCheck } from '../initialize-service-form';

import { parseDeployParams } from './parse-deploy-params';

class Test {
  instancesCatalog = new Array<CatalogInstance>();
  regionsCatalog = new Array<CatalogRegion>();
  githubOrganization: string | undefined;

  params = new URLSearchParams();

  debug() {
    // eslint-disable-next-line no-console
    console.dir(this.getValues(), { depth: null });
  }

  getValues() {
    return parseDeployParams(
      this.params,
      this.instancesCatalog,
      this.regionsCatalog,
      this.githubOrganization,
    );
  }
}

describe('parseDeployParams', () => {
  let test: Test;

  beforeEach(() => {
    test = new Test();
  });

  it('default value', () => {
    expect(test.getValues()).toEqual({});
  });

  describe('name', () => {
    it('service name', () => {
      test.params.set('name', 'name');
      expect(test.getValues()).toHaveProperty('serviceName', 'name');
    });
  });

  describe('service_type', () => {
    it('valid service type', () => {
      test.params.set('service_type', 'worker');
      expect(test.getValues()).toHaveProperty('serviceType', 'worker');
    });

    it('invalid service type', () => {
      test.params.set('service_type', 'invalid');
      expect(test.getValues()).not.toHaveProperty('serviceType');
    });

    it('worker autoscaling criteria', () => {
      test.params.set('service_type', 'worker');
      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.requests.enabled', false);
      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.cpu.enabled', true);
    });
  });

  describe('type', () => {
    it('github source', () => {
      test.params.set('type', 'git');
      expect(test.getValues()).toHaveProperty('source.type', 'git');
    });

    it('docker source', () => {
      test.params.set('type', 'docker');
      expect(test.getValues()).toHaveProperty('source.type', 'docker');
    });
  });

  describe('privileged', () => {
    it('privileged true for buildpack builder', () => {
      test.params.set('type', 'git');
      test.params.set('privileged', 'true');
      expect(test.getValues()).toHaveProperty('builder.buildpackOptions.privileged', true);
      expect(test.getValues()).not.toHaveProperty('dockerDeployment.privileged');
    });

    it('privileged true for dockerfile builder', () => {
      test.params.set('type', 'git');
      test.params.set('privileged', 'true');
      expect(test.getValues()).toHaveProperty('builder.dockerfileOptions.privileged', true);
    });

    it('privileged true for docker image deployment', () => {
      test.params.set('type', 'docker');
      test.params.set('privileged', 'true');
      expect(test.getValues()).toHaveProperty('dockerDeployment.privileged', true);
      expect(test.getValues()).not.toHaveProperty('builder.buildpackOptions.privileged');
    });
  });

  describe('instance_type', () => {
    beforeEach(() => {
      test.instancesCatalog.push(create.instance({ identifier: 'free', status: 'available' }));
      test.instancesCatalog.push(create.instance({ identifier: 'medium', status: 'available' }));
      test.instancesCatalog.push(create.instance({ identifier: 'large', status: 'coming_soon' }));
    });

    it('valid instance type', () => {
      test.params.set('instance_type', 'medium');
      expect(test.getValues()).toHaveProperty('instance.identifier', 'medium');
    });

    it('invalid instance type', () => {
      test.params.set('instance_type', 'huge');
      expect(test.getValues()).not.toHaveProperty('instance');
    });
  });

  describe('regions', () => {
    beforeEach(() => {
      test.regionsCatalog.push(create.region({ identifier: 'fra', status: 'available' }));
      test.regionsCatalog.push(create.region({ identifier: 'par', status: 'available' }));
      test.regionsCatalog.push(create.region({ identifier: 'mrs', status: 'coming_soon' }));
    });

    it('valid region', () => {
      test.params.append('regions', 'par');
      expect(test.getValues()).toHaveProperty('regions', ['par']);
    });

    it('valid regions', () => {
      test.params.append('regions', 'fra');
      test.params.append('regions', 'par');
      expect(test.getValues()).toHaveProperty('regions', ['fra', 'par']);
    });

    it('same region multiple times', () => {
      test.params.set('regions', 'fra');
      test.params.set('regions', 'fra');
      expect(test.getValues()).toHaveProperty('regions', ['fra']);
    });

    it('mixed valid and invalid regions', () => {
      test.params.append('regions', 'fra');
      test.params.append('regions', 'nop');
      test.params.append('regions', 'par');
      expect(test.getValues()).toHaveProperty('regions', ['fra', 'par']);
    });

    it('unavailable regions', () => {
      test.params.append('regions', 'fra');
      test.params.append('regions', 'mrs');
      expect(test.getValues()).toHaveProperty('regions', ['fra']);
    });
  });

  describe('env', () => {
    it('valid environment variables', () => {
      test.params.set('env[VAR1]', 'value1');
      test.params.set('env[VAR_2]', 'value2');

      expect(test.getValues()).toHaveProperty('environmentVariables', [
        { name: 'VAR1', value: 'value1' },
        { name: 'VAR_2', value: 'value2' },
      ]);
    });

    it('invalid environment variables', () => {
      test.params.set('env["VAR"]', 'value');
      test.params.set('env[MY-VAR]', 'value');
      test.params.set('env[]', 'value');

      expect(test.getValues()).not.toHaveProperty('environmentVariables');
    });

    it('duplicated environment variables', () => {
      test.params.append('env[VAR]', 'value1');
      test.params.append('env[VAR]', 'value2');

      expect(test.getValues()).toHaveProperty('environmentVariables', [{ name: 'VAR', value: 'value1' }]);
    });
  });

  describe('ports', () => {
    const healthCheck = defaultHealthCheck();

    it('valid ports', () => {
      test.params.append('ports', '1;http;/1');
      test.params.append('ports', '2;http2;/2');
      test.params.append('ports', '3;tcp');

      expect(test.getValues()).toHaveProperty('ports', [
        { portNumber: 1, public: true, protocol: 'http', path: '/1', healthCheck },
        { portNumber: 2, public: true, protocol: 'http2', path: '/2', healthCheck },
        { portNumber: 3, public: false, protocol: 'tcp', path: '', healthCheck },
      ]);
    });

    it('invalid ports', () => {
      test.params.append('ports', '1');
      test.params.append('ports', '2;nope');

      expect(test.getValues()).not.toHaveProperty('ports');
    });

    it('duplicated ports', () => {
      test.params.append('ports', '1;http;/');
      test.params.append('ports', '1;tcp');

      expect(test.getValues()).toHaveProperty('ports', [
        { portNumber: 1, public: true, protocol: 'http', path: '/', healthCheck },
        { portNumber: 1, public: false, protocol: 'tcp', path: '', healthCheck },
      ]);
    });
  });

  describe('scaling', () => {
    it('min scaling only', () => {
      test.params.set('instances_min', '1');

      expect(test.getValues()).toHaveProperty('scaling', { type: 'fixed', fixed: 1 });
    });

    it('max scaling only', () => {
      test.params.set('instances_max', '2');

      expect(test.getValues()).toHaveProperty('scaling', { type: 'fixed', fixed: 2 });
    });

    it('both with min < max', () => {
      test.params.set('instances_min', '1');
      test.params.set('instances_max', '2');

      expect(test.getValues()).toHaveProperty('scaling', {
        type: 'autoscaling',
        autoscaling: { min: 1, max: 2 },
      });
    });

    it('both with min = max', () => {
      test.params.set('instances_min', '2');
      test.params.set('instances_max', '2');

      expect(test.getValues()).toHaveProperty('scaling', { type: 'fixed', fixed: 2 });
    });

    it('both with min > max', () => {
      test.params.set('instances_min', '2');
      test.params.set('instances_max', '1');

      expect(test.getValues()).toHaveProperty('scaling', {
        type: 'autoscaling',
        autoscaling: { min: 1, max: 2 },
      });
    });

    it('invalid scaling', () => {
      test.params.set('instances_min', 'nope');

      expect(test.getValues()).not.toHaveProperty('scaling');
    });

    it('min < 0', () => {
      test.params.set('instances_min', '-1');

      expect(test.getValues()).not.toHaveProperty('scaling');
    });

    it('max <= 0', () => {
      test.params.set('instances_max', '0');

      expect(test.getValues()).not.toHaveProperty('scaling');
    });

    it('min >= 10', () => {
      test.params.set('instances_min', '10');

      expect(test.getValues()).not.toHaveProperty('scaling');
    });

    it('max >= 10', () => {
      test.params.set('instances_max', '11');

      expect(test.getValues()).not.toHaveProperty('scaling');
    });
  });

  describe('autoscaling', () => {
    it('autoscaling_average_cpu', () => {
      test.params.set('autoscaling_average_cpu', '1');

      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.cpu', {
        enabled: true,
        value: 1,
      });
    });

    it('autoscaling_average_mem', () => {
      test.params.set('autoscaling_average_mem', '1');

      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.memory', {
        enabled: true,
        value: 1,
      });
    });

    it('autoscaling_requests_per_second', () => {
      test.params.set('autoscaling_requests_per_second', '1');

      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.requests', {
        enabled: true,
        value: 1,
      });
    });

    it('autoscaling_concurrent_requests', () => {
      test.params.set('autoscaling_concurrent_requests', '1');

      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.concurrentRequests', {
        enabled: true,
        value: 1,
      });
    });

    it('autoscaling_requests_response_time', () => {
      test.params.set('autoscaling_requests_response_time', '1');

      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.responseTime', {
        enabled: true,
        value: 1,
      });
    });

    it('autoscaling_sleep_idle_delay', () => {
      test.params.set('autoscaling_sleep_idle_delay', '1');

      expect(test.getValues()).toHaveProperty('scaling.autoscaling.targets.sleepIdleDelay', {
        enabled: true,
        value: 1,
      });
    });
  });

  describe('volumes', () => {
    it('valid volumes', () => {
      test.params.append('volume_size[volume-1]', '1');
      test.params.append('volume_path[volume-1]', '/data1');

      test.params.append('volume_size[volume-2]', '2');
      test.params.append('volume_path[volume-2]', '/data2');

      expect(test.getValues()).toHaveProperty('volumes', [
        {
          name: 'volume-1',
          size: 1,
          mountPath: '/data1',
        },
        {
          name: 'volume-2',
          size: 2,
          mountPath: '/data2',
        },
      ]);
    });

    it('missing value', () => {
      test.params.append('volume_size[vol1]', '1');
      test.params.append('volume_path[vol2]', '/data');

      expect(test.getValues()).toHaveProperty('volumes', [
        { name: 'vol1', size: 1 },
        { name: 'vol2', mountPath: '/data' },
      ]);
    });

    it('invalid size', () => {
      test.params.append('volume_size[vol1]', '0');
      test.params.append('volume_size[vol2]', '-1');
      test.params.append('volume_size[vol3]', 'nope');

      expect(test.getValues()).not.toHaveProperty('volumes');
    });

    it('invalid name', () => {
      test.params.append('volume_size[+vol]', '1');

      expect(test.getValues()).not.toHaveProperty('volumes');
    });
  });

  describe('health checks', () => {
    it('health check common options', () => {
      test.params.set('hc_grace_period[1]', '1');
      test.params.set('hc_interval[1]', '2');
      test.params.set('hc_restart_limit[1]', '3');
      test.params.set('hc_timeout[1]', '4');

      expect(test.getValues()).toHaveProperty('ports.0.healthCheck', {
        gracePeriod: 1,
        interval: 2,
        restartLimit: 3,
        timeout: 4,
      });
    });

    it('tcp health check options', () => {
      test.params.set('hc_protocol[1]', 'tcp');

      expect(test.getValues()).toHaveProperty('ports.0.healthCheck', {
        protocol: 'tcp',
      });
    });

    it('http health check options', () => {
      test.params.set('hc_protocol[1]', 'http');
      test.params.set('hc_path[1]', '/health');
      test.params.set('hc_method[1]', 'POST');

      expect(test.getValues()).toHaveProperty('ports.0.healthCheck', {
        protocol: 'http',
        path: '/health',
        method: 'post',
      });
    });

    it('invalid health check protocol', () => {
      test.params.set('hc_protocol[1]', 'websocket');

      expect(test.getValues()).not.toHaveProperty('ports');
    });

    it('invalid health check method', () => {
      test.params.set('hc_method[1]', 'FETCH');

      expect(test.getValues()).not.toHaveProperty('ports');
    });
  });

  describe('git options', () => {
    beforeEach(() => {
      test.params.set('type', 'git');
    });

    describe('repository', () => {
      it('public repository', () => {
        test.params.set('repository', 'org/repo');
        expect(test.getValues()).toHaveProperty('source.git.publicRepository.repositoryName', 'org/repo');
        expect(test.getValues()).toHaveProperty('source.git.repositoryType', 'public');
      });

      it('organization repository', () => {
        test.githubOrganization = 'my-org';
        test.params.set('repository', 'my-org/repo');
        // prettier-ignore
        expect(test.getValues()).toHaveProperty('source.git.organizationRepository.repositoryName', 'my-org/repo');
        expect(test.getValues()).toHaveProperty('source.git.repositoryType', 'organization');
      });

      it('github.com prefix', () => {
        test.params.set('type', 'git');
        test.params.set('repository', 'github.com/org/repo');

        expect(test.getValues()).toHaveProperty('source.git.publicRepository.repositoryName', 'org/repo');
      });

      it('https://github.com prefix', () => {
        test.params.set('type', 'git');
        test.params.set('repository', 'https://github.com/org/repo');

        expect(test.getValues()).toHaveProperty('source.git.publicRepository.repositoryName', 'org/repo');
      });
    });

    describe('branch', () => {
      it('organization repository branch', () => {
        test.githubOrganization = 'my-org';
        test.params.set('repository', 'my-org/repo');
        test.params.set('branch', 'master');
        expect(test.getValues()).toHaveProperty('source.git.organizationRepository.branch', 'master');
      });

      it('public repository branch', () => {
        test.params.set('repository', 'org/repo');
        test.params.set('branch', 'master');
        expect(test.getValues()).toHaveProperty('source.git.publicRepository.branch', 'master');
      });
    });

    describe('workdir', () => {
      it('workdir value', () => {
        test.params.set('workdir', 'packages/web');
        expect(test.getValues()).toHaveProperty('source.git.workDirectory', 'packages/web');
      });
    });
  });

  describe('builder', () => {
    beforeEach(() => {
      test.params.set('type', 'git');
    });

    it('buildpack options', () => {
      test.params.set('builder', 'buildpack');
      test.params.set('build_command', 'build');
      test.params.set('run_command', 'run');

      expect(test.getValues()).toHaveProperty('builder.type', 'buildpack');
      expect(test.getValues()).toHaveProperty('builder.buildpackOptions', {
        buildCommand: 'build',
        runCommand: 'run',
      });
    });

    it('dockerfile options', () => {
      test.params.set('builder', 'dockerfile');
      test.params.set('dockerfile', 'dockerfile');
      test.params.append('entrypoint', 'entry1');
      test.params.append('entrypoint', 'entry2');
      test.params.set('command', 'command');
      test.params.append('args', 'arg1');
      test.params.append('args', 'arg2');
      test.params.set('target', 'target');

      expect(test.getValues()).toHaveProperty('builder.type', 'dockerfile');

      expect(test.getValues()).toHaveProperty('builder.dockerfileOptions', {
        dockerfile: 'dockerfile',
        entrypoint: ['entry1', 'entry2'],
        command: 'command',
        args: ['arg1', 'arg2'],
        target: 'target',
      });
    });
  });

  describe('docker image options', () => {
    beforeEach(() => {
      test.params.set('type', 'docker');
    });

    describe('image', () => {
      it('image', () => {
        test.params.set('image', 'image');
        expect(test.getValues()).toHaveProperty('source.docker.image', 'image');
      });

      it('image with tag', () => {
        test.params.set('image', 'image:tag');
        expect(test.getValues()).toHaveProperty('source.docker.image', 'image:tag');
      });
    });

    describe('docker options', () => {
      it('default values', () => {
        expect(test.getValues()).not.toHaveProperty('dockerDeployment');
      });

      it('entrypoint', () => {
        test.params.append('entrypoint', 'entrypoint1');
        test.params.append('entrypoint', 'entrypoint2');
        expect(test.getValues()).toHaveProperty('dockerDeployment.entrypoint', [
          'entrypoint1',
          'entrypoint2',
        ]);
      });

      it('command', () => {
        test.params.set('command', 'command');
        expect(test.getValues()).toHaveProperty('dockerDeployment.command', 'command');
      });

      it('args', () => {
        test.params.append('args', 'arg1');
        test.params.append('args', 'arg2');
        expect(test.getValues()).toHaveProperty('dockerDeployment.args', ['arg1', 'arg2']);
      });
    });
  });
});
