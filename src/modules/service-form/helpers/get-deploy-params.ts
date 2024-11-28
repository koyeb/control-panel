import { Scaling, ServiceForm } from '../service-form.types';

import { defaultHealthCheck } from './initialize-service-form';

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
  if (form.instance !== 'free') set('instance_type', form.instance);
  if (form.regions.length !== 1 || form.regions[0] !== 'fra') set('regions', form.regions);

  if (form.scaling.min === form.scaling.max) {
    if (form.scaling.min !== 1) {
      set('instances_min', String(form.scaling.min));
    }
  } else {
    set('instances_min', String(form.scaling.min));
    set('instances_max', String(form.scaling.max));

    for (const [target, { enabled, value }] of Object.entries(form.scaling.targets)) {
      const targetMap: Record<keyof Scaling['targets'], string> = {
        cpu: 'average_cpu',
        memory: 'average_mem',
        requests: 'requests_per_second',
        concurrentRequests: 'concurrent_requests',
        responseTime: 'requests_response_time',
        sleepIdleDelay: 'sleep_idle_delay',
      };

      if (enabled) {
        set(`autoscaling_${targetMap[target as keyof Scaling['targets']]}`, String(value));
      }
    }
  }

  for (const { name, value } of form.environmentVariables) {
    if (name === '') {
      continue;
    }

    set(`env[${name}]`, value);
  }

  if (form.serviceType === 'web') {
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
  }

  // do not expose volume params
  return params;
}
