import { getConfig } from 'src/application/config';

export type WrappedData = {
  deployments: number;
  regions: string[];
  createdServices: number;
  mostActiveServices: Array<{
    appName: string;
    serviceName: string;
  }>;
  deploymentMethod: 'git' | 'docker';
  pushes: number;
  buildTime: number;
  requests: number;
  team: string[];
};

type ApiResult = {
  Summary: {
    Card_1: {
      NumberOfDeployments: number;
    };
    Card_2: {
      RegionsDeployedIn: [
        {
          Region: string;
          NumberOfDeploys: number;
        },
        {
          Region: string;
          NumberOfDeploys: number;
        },
      ];
      HasDeployedInMoreThanTwoRegions: boolean;
      Top3Services: Array<{
        ServiceID: string;
        ServiceName: string;
        AppName: string;
        NumberOfDeployments: number;
      }>;
      CountServices: number;
    };
    Card_3: {
      DockerSourceStats: {
        NumberOfDeployments: number;
      };
      GitSourceStats: {
        NumberOfDeployments: number;
        NumberOfBuiltPushes: number;
        BuildStats: {
          FinishedBuilds: number;
          TotalDuration: number;
        };
      };
      Persona: 'git' | 'docker';
    };
    Card_4: {
      RequestsSummary: {
        TotalCount: number;
      };
    };
    Card_5: {
      Team: Array<{
        Name: string;
      }>;
    };
  };
};

export async function fetchWrappedData(
  token: string | undefined,
  organizationId: string,
  sync: boolean,
): Promise<ApiResult> {
  const { apiBaseUrl = '' } = getConfig();

  const url = new URL(apiBaseUrl, window.location.origin);

  url.pathname = '/v1/wrapped';

  const response = await fetch(url, {
    method: 'POST',
    headers: new Headers({
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    }),
    body: JSON.stringify({ organizationId, forceRegen: false, generateSynchronously: sync }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch wrapped data');
  }

  return response.json() as Promise<ApiResult>;
}

export function mapWrappedData(result: ApiResult): WrappedData {
  const { Card_1, Card_2, Card_3, Card_4, Card_5 } = result.Summary;

  return {
    deployments: Card_1.NumberOfDeployments,
    regions: Card_2.RegionsDeployedIn.map(({ Region }) => Region),
    createdServices: Card_2.CountServices,
    mostActiveServices: Card_2.Top3Services.map(({ AppName, ServiceName }) => ({
      appName: AppName,
      serviceName: ServiceName,
    })),
    deploymentMethod: Card_3.Persona,
    pushes: Card_3.GitSourceStats.NumberOfBuiltPushes,
    buildTime: Math.round(Card_3.GitSourceStats.BuildStats.TotalDuration / (1000 * 1000 * 1000 * 60)),
    requests: Card_4.RequestsSummary.TotalCount,
    team: Card_5.Team.map(({ Name }) => Name),
  };
}
