import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';
import { useEffect } from 'react';
import { navigate } from 'wouter/use-browser-location';

import { ApiError } from 'src/api/api-errors';
import { ApiDeploymentDefinition, ApiDeploymentStage, ApiService } from 'src/api/api-types';
import {
  createApiDeployment,
  createApiDeploymentDefinition,
  createApiInstance,
  createApiService,
} from 'src/api/mock/api-factories';
import { ApiMock, MockApiStream } from 'src/api/mock/mock-api';
import { OrganizationPlan } from 'src/api/model';
import { controls } from 'src/storybook';
import { createId } from 'src/utils/strings';

import { ServiceCreation } from './service-creation';
import { ServiceTypeStep } from './steps/00-service-type/service-type.step';
import { ImportProjectStep } from './steps/01-import-project/import-project.step';
import { InstanceRegionStep } from './steps/02-instance-region/instance-region.step';
import { ReviewStep } from './steps/03-review/review.step';
import { InitialDeploymentStep } from './steps/04-initial-deployment/initial-deployment.step';

type Args = {
  organizationPlan: OrganizationPlan;
  freeInstanceUsed: boolean;
  hasGithubApp: boolean;
  loadingRepositories: boolean;
  verifyDockerImageError: boolean;
  slowBuild: boolean;
  slowDeployment: boolean;
};

export default {
  title: 'Modules/ServiceCreation',
  parameters: { mockApi, className: 'col max-w-main gap-8' },
  args: {
    organizationPlan: 'starter',
    freeInstanceUsed: false,
    hasGithubApp: true,
    loadingRepositories: false,
    verifyDockerImageError: false,
    slowBuild: false,
    slowDeployment: false,
  },
  argTypes: {
    organizationPlan: controls.inlineRadio(['hobby', 'starter']),
  },
} satisfies Meta<Args>;

export const fullFlow: StoryFn = (_) => <ServiceCreation />;
export const serviceType: StoryFn = (_) => <ServiceTypeStep onNext={action('onNext')} />;

export const importProject: StoryFn<Args & { source?: 'git' | 'docker' }> = (_) => (
  <ImportProjectStep onNext={action('onNext')} />
);

importProject.args = {
  source: 'git',
};

importProject.argTypes = {
  source: controls.inlineRadio(['git', 'docker']),
};

importProject.decorators = [
  (Story, { args }) => {
    useEffect(() => {
      navigate(`?type=${args.source}`);
    }, [args]);

    return <Story />;
  },
];

export const instanceRegion: StoryFn = (_) => <InstanceRegionStep onNext={action('onNext')} />;
export const review: StoryFn = (_) => <ReviewStep onNext={action('onNext')} />;
export const initialDeployment: StoryFn = (_) => <InitialDeploymentStep serviceId="serviceId" />;

function mockApi(args: Args) {
  const api = new ApiMock();
  const data = api.data;

  data.organization.plan = args.organizationPlan;

  if (args.freeInstanceUsed) {
    data.organizationSummary.instances!.by_type!.free = '1';
  }

  if (!args.hasGithubApp) {
    api.mockEndpoint('getGithubApp', () => {
      throw new ApiError({ status: 404, code: '', message: '' });
    });
  }

  if (args.loadingRepositories) {
    api.mockEndpoint('listRepositories', () => {
      return new Promise<never>(() => {});
    });
  }

  if (args.verifyDockerImageError) {
    api.data.verifyDockerImage = {
      success: false,
      code: 'ANON_NOT_FOUND',
      reason: 'Docker image not found',
    };
  }

  const definition = createApiDeploymentDefinition({
    type: 'WEB',
    git: {
      repository: 'github.com/org/repo',
      branch: 'master',
      sha: 'cafe4242',
      buildpack: {
        privileged: false,
      },
    },
    env: [{}, {}],
    instance_types: [{ type: 'medium' }],
    scalings: [{ min: 2, max: 3 }],
    regions: ['fra', 'par'],
    ports: [
      { port: 4242, protocol: 'http' },
      { port: 5151, protocol: 'http' },
      { port: 6969, protocol: 'tcp' },
    ],
    routes: [
      { port: 4242, path: '/path' },
      { port: 5151, path: '/' },
    ],
  });

  api.data.deployments = [
    createApiDeployment({
      id: 'deploymentId',
      app_id: 'appId',
      service_id: 'serviceId',
      status: 'PENDING',
      definition,
    }),
  ];

  const deployment = createServiceDeployment(definition);

  const service: ApiService = createApiService({
    id: 'serviceId',
    app_id: 'appId',
    latest_deployment_id: deployment.id,
    type: definition?.type as ApiService['type'],
    name: definition?.name,
    status: 'STARTING',
  });

  data.services = [service];

  const logs = {
    runtime: new EventTarget(),
    build: new EventTarget(),
  };

  const now = () => new Date().toISOString();

  function createServiceDeployment(definition: ApiDeploymentDefinition) {
    const deployment = createApiDeployment({
      id: createId(),
      app_id: 'appId',
      service_id: 'serviceId',
      status: 'PENDING',
      definition,
    });

    data.deployments.push(deployment);

    const buildStage: ApiDeploymentStage = {
      name: 'build',
      status: 'RUNNING',
    };

    const schedule = api
      .schedule()
      .wait(args.slowBuild ? 40 * 1000 : 2 * 1000)
      .run(() => {
        buildStage.started_at = now();
        deployment.provisioning_info = { stages: [buildStage] };
        deployment.status = 'PROVISIONING';
      })
      .wait(1000);

    if (definition?.git !== undefined) {
      for (const [ms, stream, message] of buildLogs) {
        schedule.wait(ms).run(() => {
          const logLine = {
            result: {
              created_at: now(),
              labels: { stream },
              msg: message,
            },
          };

          const event = new MessageEvent('message', {
            data: JSON.stringify(logLine),
          });

          logs.build.dispatchEvent(event);
        });
      }
    }

    schedule.wait(1000).run(() => {
      buildStage.finished_at = now();
      buildStage.status = 'COMPLETED';
      deployment.status = 'SCHEDULED';
    });

    schedule.wait(args.slowDeployment ? 40 * 1000 : 2 * 1000).run(() => {
      deployment.status = 'ALLOCATING';
    });

    schedule.wait(1000).run(() => {
      deployment.status = 'STARTING';
      createDeploymentInstances();
    });

    for (const [ms, stream, message] of runtimeLogs) {
      schedule.wait(ms).run(() => {
        const logLine = {
          result: {
            created_at: now(),
            labels: { stream, instance_id: 'instanceId' },
            msg: message,
          },
        };

        const event = new MessageEvent('message', {
          data: JSON.stringify(logLine),
        });

        logs.runtime.dispatchEvent(event);
      });
    }

    schedule.wait(1000).run(() => {
      deployment.status = 'HEALTHY';
    });

    return deployment;
  }

  function createDeploymentInstances() {
    const instance = createApiInstance({
      id: 'instanceId',
      app_id: 'appId',
      service_id: 'serviceId',
      status: 'STARTING',
      region: 'fra',
      messages: ['Instance is starting'],
      created_at: now(),
      xyz_deployment_id: deployment.id,
    });

    data.instances.push(instance);

    const schedule = api.schedule();

    schedule.wait(5000).run(() => {
      instance.status = 'HEALTHY';
      instance.messages?.push('Instance started');
    });
  }

  api.mockStream('logs', ({ query }) => {
    const stream = new MockApiStream();
    const schedule = api.schedule();

    stream.readyState = WebSocket.CONNECTING;
    stream.addEventListener('close', () => schedule.clear());

    schedule.run(() => {
      stream.readyState = WebSocket.OPEN;
      stream.dispatchEvent(new Event('open'));
    });

    if (logs) {
      logs[query!.type as 'build' | 'runtime'].addEventListener('message', (event) =>
        stream.dispatchEvent(new MessageEvent('message', event)),
      );
    }

    return stream;
  });
}

// prettier-ignore
const buildLogs = [
  [10,   'stderr', 'Previous image with name "registry01.prod.koyeb.com/k-7938074c-9ae4-47f5-bdd5-e39c9febf797/85c5fb56-930a-4465-b470-2d01c9c8deb6:latest" not found'],
  [200,  'stderr', '1 of 2 buildpacks participating'],
  [10,   'stderr', 'heroku/go 0.0.0'],
  [10,   'stderr', 'Layer cache not found'],
  [1000, 'stderr', '-----> Fetching jq... done'],
  [10,   'stderr', '-----> Fetching stdlib.sh.v8... done'],
  [10,   'stderr', '-----> '],
  [10,   'stderr', '[1;32m       Detected go modules via go.mod[0m'],
  [10,   'stderr', '-----> '],
  [10,   'stderr', '[1;32m       Detected Module Name: example-go-gin[0m'],
  [10,   'stderr', '-----> '],
  [10,   'stderr', '-----> New Go Version, clearing old cache'],
  [10,   'stderr', '-----> Installing go1.17.13'],
  [10,   'stderr', '-----> Fetching go1.17.13.linux-amd64.tar.gz... done'],
  [10,   'stderr', '-----> Determining packages to install'],
  [500,  'stderr', 'go: downloading github.com/gin-gonic/gin v1.7.4'],
  [10,   'stderr', 'go: downloading github.com/gin-contrib/sse v0.1.0'],
  [10,   'stderr', 'go: downloading github.com/mattn/go-isatty v0.0.12'],
  [10,   'stderr', 'go: downloading github.com/golang/protobuf v1.3.3'],
  [200,  'stderr', 'go: downloading github.com/ugorji/go/codec v1.1.7'],
  [10,   'stderr', 'go: downloading gopkg.in/yaml.v2 v2.2.8'],
  [10,   'stderr', 'go: downloading github.com/go-playground/validator/v10 v10.4.1'],
  [100,  'stderr', 'go: downloading golang.org/x/sys v0.0.0-20200116001909-b77594299b42'],
  [10,   'stderr', 'go: downloading golang.org/x/crypto v0.0.0-20200622213623-75b288015ac9'],
  [10,   'stderr', 'go: downloading github.com/go-playground/universal-translator v0.17.0'],
  [10,   'stderr', 'go: downloading github.com/leodido/go-urn v1.2.0'],
  [10,   'stderr', 'go: downloading github.com/go-playground/locales v0.13.0'],
  [1000, 'stderr', '[1;32m       [0m'],
  [10,   'stderr', '[1;32m       Detected the following main packages to install:[0m'],
  [10,   'stderr', '[1;32m       		example-go-gin[0m'],
  [10,   'stderr', '[1;32m       [0m'],
  [500,  'stderr', '-----> Running: go install -v -tags heroku example-go-gin '],
  [300,  'stderr', 'github.com/gin-gonic/gin/internal/bytesconv'],
  [10,   'stderr', 'github.com/go-playground/locales/currency'],
  [10,   'stderr', 'golang.org/x/crypto/sha3'],
  [10,   'stderr', 'github.com/go-playground/locales'],
  [10,   'stderr', 'golang.org/x/sys/unix'],
  [10,   'stderr', 'github.com/gin-gonic/gin/internal/json'],
  [10,   'stderr', 'github.com/leodido/go-urn'],
  [10,   'stderr', 'github.com/golang/protobuf/proto'],
  [10,   'stderr', 'github.com/gin-contrib/sse'],
  [10,   'stderr', 'github.com/ugorji/go/codec'],
  [100,  'stderr', 'gopkg.in/yaml.v2'],
  [10,   'stderr', 'github.com/go-playground/universal-translator'],
  [10,   'stderr', 'github.com/go-playground/validator/v10'],
  [10,   'stderr', 'github.com/mattn/go-isatty'],
  [10,   'stderr', 'github.com/gin-gonic/gin/binding'],
  [10,   'stderr', 'github.com/gin-gonic/gin/render'],
  [10,   'stderr', 'github.com/gin-gonic/gin'],
  [100,  'stderr', 'example-go-gin'],
  [200,  'stderr', '[1;32m       [0m'],
  [10,   'stderr', '[1;32m       Installed the following binaries:[0m'],
  [10,   'stderr', '[1;32m       		./bin/example-go-gin[0m'],
  [10,   'stderr', '[1;32m       [0m'],
  [10,   'stderr', '[1;32m       Created a Procfile with the following entries:[0m'],
  [10,   'stderr', '[1;32m       		web: bin/example-go-gin[0m'],
  [10,   'stderr', '[1;32m       [0m'],
  [10,   'stderr', '[1;32m       If these entries look incomplete or incorrect please create a Procfile with the required entries.[0m'],
  [10,   'stderr', '[1;32m       See https://devcenter.heroku.com/articles/procfile for more details about Procfiles[0m'],
  [10,   'stderr', '[1;32m       [0m'],
  [400,  'stderr', 'Adding layer \'heroku/go:profile\''],
  [10,   'stderr', 'Adding layer \'launch.sbom\''],
  [10,   'stderr', 'Adding 1/1 app layer(s)'],
  [10,   'stderr', 'Adding layer \'launcher\''],
  [10,   'stderr', 'Adding layer \'config\''],
  [10,   'stderr', 'Adding layer \'process-types\''],
  [10,   'stderr', 'Adding label \'io.buildpacks.lifecycle.metadata\''],
  [10,   'stderr', 'Adding label \'io.buildpacks.build.metadata\''],
  [10,   'stderr', 'Adding label \'io.buildpacks.project.metadata\''],
  [100,  'stderr', 'Setting default process type \'web\''],
  [10,   'stderr', 'Saving registry01.prod.koyeb.com/k-7938074c-9ae4-47f5-bdd5-e39c9febf797/85c5fb56-930a-4465-b470-2d01c9c8deb6:latest...'],
  [200,  'stderr', '*** Images (sha256:020eea5576585811732bb849e9cd88cdd3aab212a76a7bbdf69c220dc95355b8):'],
  [10,   'stderr', '      registry01.prod.koyeb.com/k-7938074c-9ae4-47f5-bdd5-e39c9febf797/85c5fb56-930a-4465-b470-2d01c9c8deb6:latest'],
  [10,   'stderr', '      registry01.prod.koyeb.com/k-7938074c-9ae4-47f5-bdd5-e39c9febf797/85c5fb56-930a-4465-b470-2d01c9c8deb6:712a21f4-c25d-4844-b6cf-0721626c1a11'],
  [100,  'stderr', 'Layer cache not found'],
  [100,  'stderr', 'Adding cache layer \'heroku/go:shim\''],
  [1200, 'stderr', 'Build succeeded ✅'],
] as const;

// prettier-ignore
const runtimeLogs = [
  [500,  'koyeb', 'Instance created. Preparing to start...'],
  [200,  'koyeb', 'Instance is starting. Propagating network configuration...'],
  [1000, 'koyeb', 'Network configuration propagated'],
  [500,  'stdout', 'yarn run v1.22.19'],
  [500,  'stdout', '$ next start -p ${PORT:-3000}'],
  [700,  'stdout', 'ready - started server on 0.0.0.0:8000, url: http://localhost:8000'],
  [200,  'koyeb', 'Instance is healthy. All health checks are passing.'],
] as const;
