import merge from 'lodash-es/merge';
import unique from 'lodash-es/uniq';
import { ValueOf } from 'type-fest';

import { CatalogInstance, CatalogRegion, EnvironmentVariable } from 'src/api/model';
import { inArray } from 'src/utils/arrays';
import { hasProperty } from 'src/utils/object';
import { DeepPartial } from 'src/utils/types';

import {
  GitSource,
  HealthCheck,
  HealthCheckProtocol,
  Port,
  Scaling,
  ServiceForm,
  ServiceVolume,
} from '../service-form.types';

import { defaultHealthCheck } from './initialize-service-form';

export function parseDeployParams(
  params: URLSearchParams,
  instancesCatalog: CatalogInstance[],
  regionsCatalog: CatalogRegion[],
  githubOrganization: string | undefined,
): DeepPartial<ServiceForm> {
  const builder = new ServiceFormBuilder(instancesCatalog, regionsCatalog, githubOrganization);

  builder.appId = params.get('app_id');
  builder.appName = params.get('app_name');
  builder.name = params.get('name');
  builder.serviceType = params.get('service_type');
  builder.type = params.get('type');
  builder.privileged = params.get('privileged');
  builder.instanceType = params.get('instance_type');
  builder.regions = params.getAll('regions');
  builder.env = params.entries();
  builder.ports = params.getAll('ports');
  builder.instances_min = params.get('instances_min');
  builder.instances_max = params.get('instances_max');
  builder.autoscaling_average_cpu = params.get('autoscaling_average_cpu');
  builder.autoscaling_average_mem = params.get('autoscaling_average_mem');
  builder.autoscaling_requests_per_second = params.get('autoscaling_requests_per_second');
  builder.autoscaling_concurrent_requests = params.get('autoscaling_concurrent_requests');
  builder.autoscaling_requests_response_time = params.get('autoscaling_requests_response_time');
  builder.autoscaling_sleep_idle_delay = params.get('autoscaling_sleep_idle_delay');
  builder.volumes = params.entries();
  builder.healthChecks = params.entries();

  if (builder.type === 'git') {
    builder.repository = params.get('repository');
    builder.branch = params.get('branch');
    builder.workdir = params.get('workdir');
    builder.builder = params.get('builder');

    if (builder.builder === 'buildpack') {
      builder.buildCommand = params.get('build_command');
      builder.runCommand = params.get('run_command');
    }

    if (builder.builder === 'dockerfile') {
      builder.dockerfile = params.get('dockerfile');
      builder.entrypoint = params.getAll('entrypoint');
      builder.command = params.get('command');
      builder.args = params.getAll('args');
      builder.target = params.get('target');
    }
  }

  if (builder.type === 'docker') {
    builder.image = params.get('image');
    builder.entrypoint = params.getAll('entrypoint');
    builder.command = params.get('command');
    builder.args = params.getAll('args');
  }

  return builder.get();
}

class ServiceFormBuilder {
  private values: DeepPartial<ServiceForm> = {};

  constructor(
    private readonly instancesCatalog: CatalogInstance[],
    private readonly regionsCatalog: CatalogRegion[],
    private readonly githubOrganization: string | undefined,
  ) {}

  get() {
    return this.values;
  }

  private set<Key extends keyof ServiceForm>(key: Key, value: DeepPartial<ServiceForm[Key]>) {
    merge(this.values, { [key]: value });
  }

  set appId(appId: string | null) {
    if (appId !== null) {
      this.set('meta', { appId });
    }
  }

  set appName(appName: string | null) {
    if (appName !== null) {
      this.set('appName', appName);
    }
  }

  set name(name: string | null) {
    if (name !== null) {
      this.set('serviceName', name);
    }
  }

  set serviceType(type: string | null) {
    if (type === 'web') {
      this.set('serviceType', 'web');
    }

    if (type === 'worker') {
      this.set('serviceType', 'worker');
    }
  }

  set type(type: string | null) {
    if (type === 'git') {
      this.set('source', { type: 'git' });
    }

    if (type === 'docker') {
      this.set('source', { type: 'docker' });
    }
  }

  get type() {
    return this.values.source?.type ?? null;
  }

  set privileged(privileged: string | null) {
    if (privileged === 'true') {
      if (this.type === 'git') {
        this.set('builder', {
          buildpackOptions: { privileged: true },
          dockerfileOptions: { privileged: true },
        });
      } else {
        this.set('dockerDeployment', {
          privileged: true,
        });
      }
    }
  }

  private isValidInstance(instanceType: string): boolean {
    return this.instancesCatalog.some(hasProperty('id', instanceType));
  }

  set instanceType(instanceType: string | null) {
    if (instanceType && this.isValidInstance(instanceType)) {
      this.set('instance', instanceType);
    }
  }

  private isValidRegion(regionId: string): boolean {
    return this.regionsCatalog.some((region) => region.id === regionId && region.status === 'available');
  }

  set regions(regions: string[]) {
    regions = regions.filter((region) => this.isValidRegion(region));
    regions = unique(regions);

    if (regions.length > 0) {
      this.set('regions', regions);
    }
  }

  set env(entries: IterableIterator<[key: string, value: string]>) {
    const variables = new Array<EnvironmentVariable>();

    for (const [key, value] of entries) {
      const match = key.match(/env\[([a-zA-Z0-9_]+)\]/);

      if (!match) {
        continue;
      }

      if (variables.some(({ name }) => name === match[1])) {
        continue;
      }

      variables.push({
        name: match[1] as string,
        value,
        regions: [],
      });
    }

    if (variables.length > 0) {
      this.set('environmentVariables', variables);
    }
  }

  private parsePort(value: string): Port | void {
    const [port, protocol, path = '', tcpProxy] = value.split(';');

    if (Number.isNaN(Number(port))) {
      return;
    }

    if (!inArray(protocol, ['http', 'http2', 'tcp'] as const)) {
      return;
    }

    return {
      portNumber: Number(port),
      protocol: protocol,
      public: protocol !== 'tcp' && path !== '',
      tcpProxy: tcpProxy === 'true',
      path,
      healthCheck: defaultHealthCheck(),
    };
  }

  set ports(portsInput: string[]) {
    const ports = new Array<Port>();

    for (const value of portsInput) {
      const port = this.parsePort(value);

      if (port) {
        ports.push(port);
      }
    }

    if (ports.length > 0) {
      this.set('ports', ports);
    }
  }

  set instances_min(value: string | null) {
    if (value !== null) {
      const min = Number(value);

      if (!Number.isNaN(min) && min >= 0 && min <= 20) {
        this.set('scaling', { min });
      }
    }
  }

  set instances_max(value: string | null) {
    if (value !== null) {
      const max = Number(value);

      if (!Number.isNaN(max) && max > 0 && max <= 20) {
        this.set('scaling', { max });
      }
    }
  }

  set autoscaling_average_cpu(value: string | null) {
    this.setAutoscalingTarget('cpu', value);
  }

  set autoscaling_average_mem(value: string | null) {
    this.setAutoscalingTarget('memory', value);
  }

  set autoscaling_requests_per_second(value: string | null) {
    this.setAutoscalingTarget('requests', value);
  }

  set autoscaling_concurrent_requests(value: string | null) {
    this.setAutoscalingTarget('concurrentRequests', value);
  }

  set autoscaling_requests_response_time(value: string | null) {
    this.setAutoscalingTarget('responseTime', value);
  }

  set autoscaling_sleep_idle_delay(value: string | null) {
    if (value !== null) {
      this.set('scaling', {
        targets: { sleepIdleDelay: { deepSleepValue: Number(value) } },
      });
    }
  }

  private setAutoscalingTarget(target: keyof Scaling['targets'], value: string | null) {
    if (value !== null) {
      this.set('scaling', {
        targets: { [target]: { enabled: true, value: Number(value) } },
      });
    }
  }

  set volumes(entries: IterableIterator<[key: string, value: string]>) {
    const volumes: Record<string, Partial<ServiceVolume>> = {};

    for (const [key, value] of entries) {
      const { field, name } = this.parseVolumeKey(key);

      if (!name) {
        continue;
      }

      if (field === 'size') {
        const size = Number(value);

        if (Number.isInteger(size) && size > 0) {
          volumes[name] ??= { name };
          volumes[name].size = size;
        }
      }

      if (field === 'path') {
        volumes[name] ??= { name };
        volumes[name].mountPath = value;
      }
    }

    if (Object.values(volumes).length > 0) {
      this.set('volumes', Object.values(volumes));
    }
  }

  private parseVolumeKey(key: string) {
    const match = key.match(/^volume_(size|path)\[([-_a-zA-Z0-9]+)\]$/);

    if (!match) {
      return {};
    }

    return {
      field: match[1],
      name: match[2],
    };
  }

  set healthChecks(entries: IterableIterator<[key: string, value: string]>) {
    for (const [key, value] of entries) {
      const [portNumber, target, parsed] = this.parseHealthCheck(key, value);

      if (!portNumber || !target || !parsed) {
        continue;
      }

      let port = this.values.ports?.find((port) => port?.portNumber === portNumber);

      if (port === undefined) {
        port = { portNumber };

        this.values.ports ??= [];
        this.values.ports.push(port);
      }

      port.healthCheck ??= {};
      Object.assign(port.healthCheck, { [target]: parsed });
    }
  }

  private parseHealthCheck(
    key: string,
    value: string,
  ): [
    portNumber: number | undefined,
    target: keyof HealthCheck | undefined,
    value: ValueOf<HealthCheck> | undefined,
  ] {
    const re = /hc_(protocol|grace_period|interval|restart_limit|timeout|path|method)\[([0-9]+)\]/;
    const match = key.match(re);

    if (!match) {
      return [undefined, undefined, undefined];
    }

    let target: keyof HealthCheck | undefined = undefined;
    let parsed: ValueOf<HealthCheck> | undefined = undefined;

    switch (match[1]) {
      case 'protocol':
        target = 'protocol';
        parsed = this.parseHealthCheckProtocol(value);
        break;

      case 'grace_period':
        target = 'gracePeriod';
        parsed = this.parseHealthCheckNumber(value);
        break;

      case 'interval':
        target = 'interval';
        parsed = this.parseHealthCheckNumber(value);
        break;

      case 'restart_limit':
        target = 'restartLimit';
        parsed = this.parseHealthCheckNumber(value);
        break;

      case 'timeout':
        target = 'timeout';
        parsed = this.parseHealthCheckNumber(value);
        break;

      case 'path':
        target = 'path';
        parsed = value;
        break;

      case 'method':
        target = 'method';
        parsed = this.parseHealthCheckMethod(value);
        break;
    }

    return [Number(match[2]), target, parsed];
  }

  private parseHealthCheckProtocol(value: string): HealthCheckProtocol | undefined {
    if (value === 'tcp' || value === 'http') {
      return value;
    }
  }

  private parseHealthCheckNumber(value: string): number | undefined {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  private parseHealthCheckMethod(value: string): string | undefined {
    const val = value.toLowerCase();

    if (inArray(val, ['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'trace'])) {
      return val;
    }
  }

  set repository(repository: string | null) {
    if (repository === null) {
      return;
    }

    const git = (): DeepPartial<GitSource> => {
      const repositoryName = repository.replace(/^(https?:\/\/)?github.com\//, '');

      if (this.githubOrganization && repositoryName.startsWith(this.githubOrganization + '/')) {
        return {
          repositoryType: 'organization',
          organizationRepository: { repositoryName },
        };
      }

      return {
        repositoryType: 'public',
        publicRepository: { repositoryName },
      };
    };

    this.set('source', {
      type: 'git',
      git: git(),
    });
  }

  get repositoryType() {
    return this.values.source?.git?.repositoryType;
  }

  set branch(branch: string | null) {
    if (branch === null) {
      return;
    }

    if (this.repositoryType === 'organization') {
      this.set('source', {
        git: { organizationRepository: { branch } },
      });
    }

    if (this.repositoryType === 'public') {
      this.set('source', {
        git: { publicRepository: { branch } },
      });
    }
  }

  set workdir(workDirectory: string | null) {
    if (workDirectory !== null) {
      this.set('source', { git: { workDirectory } });
    }
  }

  set builder(builder: string | null) {
    if (builder === 'buildpack') {
      this.set('builder', { type: 'buildpack' });
    }

    if (builder === 'dockerfile') {
      this.set('builder', { type: 'dockerfile' });
    }
  }

  get builder() {
    return this.values.builder?.type ?? null;
  }

  set buildCommand(buildCommand: string | null) {
    if (buildCommand !== null) {
      this.set('builder', { buildpackOptions: { buildCommand } });
    }
  }

  set runCommand(runCommand: string | null) {
    if (runCommand !== null) {
      this.set('builder', { buildpackOptions: { runCommand } });
    }
  }

  set dockerfile(dockerfile: string | null) {
    if (dockerfile) {
      this.set('builder', { dockerfileOptions: { dockerfile } });
    }
  }

  set entrypoint(entrypoint: string[]) {
    if (entrypoint.length === 0) {
      return;
    }

    if (this.values.source?.type === 'git') {
      this.set('builder', { dockerfileOptions: { entrypoint } });
    }

    if (this.values.source?.type === 'docker') {
      this.set('dockerDeployment', { entrypoint });
    }
  }

  set command(command: string | null) {
    if (command === null) {
      return;
    }

    if (this.type === 'git') {
      this.set('builder', { dockerfileOptions: { command } });
    }

    if (this.type === 'docker') {
      this.set('dockerDeployment', { command });
    }
  }

  set args(args: string[]) {
    if (args.length === 0) {
      return;
    }

    if (this.type === 'git') {
      if (!this.values.builder?.dockerfileOptions?.command) {
        this.set('builder', { dockerfileOptions: { command: args[0] } });
        this.set('builder', { dockerfileOptions: { args: args.slice(1) } });
      } else {
        this.set('builder', { dockerfileOptions: { args } });
      }
    }

    if (this.type === 'docker') {
      if (!this.values.dockerDeployment?.command) {
        this.set('dockerDeployment', { command: args[0] });
        this.set('dockerDeployment', { args: args.slice(1) });
      } else {
        this.set('dockerDeployment', { args });
      }
    }
  }

  set target(target: string | null) {
    if (target) {
      this.set('builder', { dockerfileOptions: { target } });
    }
  }

  set image(image: string | null) {
    if (image) {
      this.set('source', { docker: { image } });
    }
  }
}
