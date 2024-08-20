import merge from 'lodash-es/merge';
import unique from 'lodash-es/uniq';

import { CatalogInstance, CatalogRegion, EnvironmentVariable } from 'src/api/model';
import { DeepPartial } from 'src/utils/types';

import { defaultHealthCheck } from '../initialize-service-form';
import { GitSource, Port, PortProtocol, ServiceForm } from '../service-form.types';

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
        type: 'plaintext',
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

  const set = (param: string, value: string | string[] | boolean | null) => {
    if (value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((value) => params.append(param, value));
    }

    if (typeof value === 'boolean' && value) {
      params.set(param, 'true');
    }

    if (typeof value === 'string') {
      params.set(param, value);
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

  for (const { name, value } of form.environmentVariables) {
    set(`env[${name}]`, value);
  }

  for (const { portNumber, path } of form.ports) {
    params.append('ports', [portNumber, 'http', path].join(';'));
  }

  return params;
}
