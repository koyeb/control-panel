import merge from 'lodash-es/merge';
import unique from 'lodash-es/uniq';
import { ValueOf } from 'type-fest';

import { CatalogInstance, CatalogRegion, EnvironmentVariable } from 'src/api/model';
import { inArray } from 'src/utils/arrays';
import { DeepPartial } from 'src/utils/types';

import { defaultHealthCheck } from '../initialize-service-form';
import {
  AutoScaling,
  GitSource,
  HealthCheck,
  HealthCheckProtocol,
  Port,
  PortProtocol,
  ServiceForm,
} from '../service-form.types';

export function parseDeployParams(
  params: URLSearchParams,
  instancesCatalog: CatalogInstance[],
  regionsCatalog: CatalogRegion[],
  githubOrganization: string | undefined,
): DeepPartial<ServiceForm> {
  const builder = new ServiceFormBuilder(instancesCatalog, regionsCatalog, githubOrganization);

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
      this.set('scaling', { autoscaling: { targets: { requests: { enabled: false } } } });
      this.set('scaling', { autoscaling: { targets: { cpu: { enabled: true } } } });
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
    return this.instancesCatalog.some(
      (instance) => instance.identifier === instanceType && instance.status === 'available',
    );
  }

  set instanceType(instanceType: string | null) {
    if (instanceType && this.isValidInstance(instanceType)) {
      this.set('instance', { identifier: instanceType });
    }
  }

  private isValidRegion(identifier: string): boolean {
    return this.regionsCatalog.some(
      (region) => region.identifier === identifier && region.status === 'available',
    );
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
      });
    }

    if (variables.length > 0) {
      this.set('environmentVariables', variables);
    }
  }

  private parsePort(value: string): Port | void {
    let match = value.match(/(\d+);(http|http2);(.+)/);

    if (match) {
      return {
        portNumber: Number(match[1]),
        protocol: match[2] as PortProtocol,
        public: true,
        path: match[3] as string,
        healthCheck: defaultHealthCheck(),
      };
    }

    match = value.match(/(\d+);tcp/);

    if (match) {
      return {
        portNumber: Number(match[1]),
        protocol: 'tcp',
        public: false,
        path: '',
        healthCheck: defaultHealthCheck(),
      };
    }
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
      this.setScaling(Number(value), this.values.scaling?.fixed);
    }
  }

  set instances_max(value: string | null) {
    if (value !== null) {
      this.setScaling(this.values.scaling?.fixed, Number(value));
    }
  }

  private setScaling(min: number | undefined, max: number | undefined) {
    if (Number.isNaN(min) || Number.isNaN(max)) {
      return;
    }

    if (min !== undefined && (min < 0 || min >= 10)) {
      return;
    }

    if (max !== undefined && (max <= 0 || max >= 10)) {
      return;
    }

    if (min !== undefined && max !== undefined) {
      if (min > max) {
        this.setScaling(max, min);
      } else if (min === max) {
        this.set('scaling', { type: 'fixed', fixed: min });
      } else {
        this.values.scaling = {};
        this.set('scaling', { type: 'autoscaling', autoscaling: { min, max } });
      }
    }

    if (max === undefined) {
      this.set('scaling', { type: 'fixed', fixed: min });
    }

    if (min === undefined) {
      this.set('scaling', { type: 'fixed', fixed: max });
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

  private setAutoscalingTarget(target: keyof AutoScaling['targets'], value: string | null) {
    if (value !== null) {
      this.set('scaling', {
        autoscaling: { targets: { [target]: { enabled: true, value: Number(value) } } },
      });
    }
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
      this.set('builder', { dockerfileOptions: { args } });
    }

    if (this.type === 'docker') {
      this.set('dockerDeployment', { args });
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

export function getDeployParams(form: ServiceForm): URLSearchParams {
  const params = new URLSearchParams({
    name: form.serviceName,
  });

  const set = (param: string, value: string | string[] | number | boolean | null) => {
    if (value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((value) => params.append(param, value));
    }

    if (typeof value === 'boolean' && value) {
      params.set(param, 'true');
    }

    if (typeof value === 'string' || typeof value === 'number') {
      params.set(param, String(value));
    }
  };

  if (form.source.type === 'git') {
    const { git } = form.source;
    const builder = form.builder;

    set('type', 'git');

    if (git.repositoryType === 'organization') {
      set('repository', git.organizationRepository.repositoryName);
      set('branch', git.organizationRepository.branch);
    } else {
      set('repository', git.publicRepository.repositoryName);
      set('branch', git.publicRepository.branch);
    }

    set('workdir', git.workDirectory);

    if (builder.type === 'buildpack') set('builder', 'buildpack');
    set('build_command', builder.buildpackOptions.buildCommand);
    set('run_command', builder.buildpackOptions.runCommand);

    if (builder.type === 'dockerfile') set('builder', 'dockerfile');
    set('dockerfile', builder.dockerfileOptions.dockerfile);
    set('entrypoint', builder.dockerfileOptions.entrypoint);
    set('command', builder.dockerfileOptions.command);
    set('args', builder.dockerfileOptions.args);
    set('target', builder.dockerfileOptions.target);

    if (builder.type === 'buildpack') set('privileged', builder.buildpackOptions.privileged);
    if (builder.type === 'dockerfile') set('privileged', builder.dockerfileOptions.privileged);
  }

  if (form.source.type === 'docker') {
    const { docker } = form.source;
    const { dockerDeployment } = form;

    set('type', 'docker');
    set('image', docker.image);

    set('entrypoint', dockerDeployment.entrypoint);
    set('command', dockerDeployment.command);
    set('args', dockerDeployment.args);
    set('privileged', dockerDeployment.privileged);
  }

  if (form.serviceType !== 'web') set('service_type', form.serviceType);
  if (form.instance.identifier !== 'free') set('instance_type', form.instance.identifier);
  if (form.regions.length !== 1 || form.regions[0] !== 'fra') set('regions', form.regions);

  if (form.scaling.type === 'fixed') {
    if (form.scaling.fixed !== 1) {
      set('instances_min', String(form.scaling.fixed));
    }
  } else {
    set('instances_min', String(form.scaling.autoscaling.min));
    set('instances_max', String(form.scaling.autoscaling.max));

    for (const [target, { enabled, value }] of Object.entries(form.scaling.autoscaling.targets)) {
      const targetMap: Record<keyof AutoScaling['targets'], string> = {
        cpu: 'average_cpu',
        memory: 'average_mem',
        requests: 'requests_per_second',
        concurrentRequests: 'concurrent_requests',
        responseTime: 'requests_response_time',
      };

      if (enabled) {
        set(`autoscaling_${targetMap[target as keyof AutoScaling['targets']]}`, String(value));
      }
    }
  }

  for (const { name, value } of form.environmentVariables) {
    set(`env[${name}]`, value);
  }

  for (const { portNumber, path, public: isPublic, protocol, healthCheck: hc } of form.ports) {
    params.append('ports', [portNumber, protocol, isPublic ? path : undefined].filter(Boolean).join(';'));

    const defaultHc = defaultHealthCheck();

    if (hc.protocol !== defaultHc.protocol) set(`hc_protocol[${portNumber}]`, hc.protocol);
    if (hc.gracePeriod !== defaultHc.gracePeriod) set(`hc_grace_period[${portNumber}]`, hc.gracePeriod);
    if (hc.interval !== defaultHc.interval) set(`hc_interval[${portNumber}]`, hc.interval);
    if (hc.restartLimit !== defaultHc.restartLimit) set(`hc_restart_limit[${portNumber}]`, hc.restartLimit);
    if (hc.timeout !== defaultHc.timeout) set(`hc_timeout[${portNumber}]`, hc.timeout);
    if (hc.path !== defaultHc.path) set(`hc_path[${portNumber}]`, hc.path);
    if (hc.method !== defaultHc.method) set(`hc_method[${portNumber}]`, hc.method);
  }

  return params;
}
