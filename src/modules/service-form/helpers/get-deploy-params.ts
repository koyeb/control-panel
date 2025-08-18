import { dequal } from 'dequal';

import { entries } from 'src/utils/object';

import { Scaling, ServiceForm } from '../service-form.types';

import { defaultServiceForm } from './initialize-service-form';

export function getDeployParams(form: ServiceForm, removeDefaultValues = true): URLSearchParams {
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

  set('service_type', form.serviceType);
  set('instance_type', form.instance);
  set('regions', form.regions);

  set('instances_min', form.scaling.min);
  set('instances_max', form.scaling.max);

  for (const [target, value] of entries(form.scaling.targets)) {
    if ('enabled' in value && value.enabled) {
      set(`autoscaling_${scalingTargetMap[target]}`, value.value);
    }
  }

  if (form.scaling.min === 0) {
    set(`autoscaling_sleep_idle_delay`, form.scaling.scaleToZero.idlePeriod);
  }

  for (const { name, value } of form.environmentVariables) {
    if (name !== '') {
      set(`env[${name}]`, value);
    }
  }

  if (form.serviceType === 'web') {
    for (const { portNumber, path, public: isPublic, protocol, tcpProxy, healthCheck } of form.ports) {
      const port = [portNumber, protocol, isPublic ? path : '', tcpProxy ? 'true' : '']
        .join(';')
        .replace(/;+$/, '');

      params.append('ports', port);

      set(`hc_protocol[${portNumber}]`, healthCheck.protocol);
      set(`hc_grace_period[${portNumber}]`, healthCheck.gracePeriod);
      set(`hc_interval[${portNumber}]`, healthCheck.interval);
      set(`hc_restart_limit[${portNumber}]`, healthCheck.restartLimit);
      set(`hc_timeout[${portNumber}]`, healthCheck.timeout);
      set(`hc_path[${portNumber}]`, healthCheck.path);
      set(`hc_method[${portNumber}]`, healthCheck.method);
    }
  }

  if (removeDefaultValues) {
    const defaultParams = getDeployParams(defaultServiceForm(), false);
    const keysToDelete = new Set<string>();

    for (const key of params.keys()) {
      if (key === 'type') {
        continue;
      }

      const value = params.getAll(key);
      const defaultValue = defaultParams.getAll(key);

      if (dequal(value, defaultValue)) {
        keysToDelete.add(key);
      }
    }

    keysToDelete.forEach((key) => params.delete(key));
  }

  // do not expose volume params
  return params;
}

const scalingTargetMap: Record<keyof Scaling['targets'], string> = {
  cpu: 'average_cpu',
  memory: 'average_mem',
  requests: 'requests_per_second',
  concurrentRequests: 'concurrent_requests',
  responseTime: 'requests_response_time',
};
