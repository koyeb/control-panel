import { useBreakpoint } from '@koyeb/design-system';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from 'src/api/api';
import { useApp, useDeployment, useInstancesQuery, useService } from 'src/api/hooks/service';
import { isComputeDeployment, mapDeployment } from 'src/api/mappers/deployment';
import { App, ComputeDeployment, Instance, Service } from 'src/api/model';
import { allApiDeploymentStatuses, isUpcomingDeployment } from 'src/application/service-functions';
import { useObserve, usePrevious } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useShortcut } from 'src/hooks/shortcut';
import { AssertionError, assert, defined } from 'src/utils/assert';
import { isDefined } from 'src/utils/generic';
import { getId, hasProperty } from 'src/utils/object';

export type ServiceOverview = QueriesState & State & Actions;

type QueriesState = {
  app: App;
  service: Service;
  deployments: ComputeDeployment[];
  deploymentsQuery: { isPending: boolean; error: Error | null };
  totalDeployments: number;
  hasMoreDeployments: boolean;
  isLoadingMoreDeployments: boolean;
  loadMoreDeployments: () => void;
  instances: Instance[];
};

type State = {
  listExpanded: boolean;
  upcomingExpanded: boolean;
  pastExpanded: boolean;
  sortedDeployments: ComputeDeployment[];
  selectedDeployment?: ComputeDeployment;
  activeDeployment?: ComputeDeployment;
  upcomingDeployments: ComputeDeployment[];
  pastDeployments: ComputeDeployment[];
};

type Actions = {
  setListExpanded: (expanded: boolean) => void;
  setUpcomingExpanded: (expanded: boolean) => void;
  setPastExpanded: (expanded: boolean) => void;
  onDeploymentSelected: (deployment: ComputeDeployment) => void;
};

export function useServiceOverview(serviceId: string): ServiceOverview {
  const service = defined(useService(serviceId));
  const app = defined(useApp(service.appId));

  const {
    deploymentsQuery,
    deployments,
    totalDeployments,
    hasMoreDeployments,
    isLoadingMoreDeployments,
    loadMoreDeployments,
  } = useDeployments(service);

  assert(deployments.every(isComputeDeployment), new AssertionError('Unexpected deployment type'));

  const [state, actions] = useContextState(service, deployments);

  const instancesQuery = useInstancesQuery({ deploymentId: state.selectedDeployment?.id });
  const instances = instancesQuery.data?.instances ?? [];

  useShortcuts(
    state.sortedDeployments.findIndex(hasProperty('id', state.selectedDeployment?.id)),
    (index) => actions.onDeploymentSelected(state.sortedDeployments[index]!),
    totalDeployments,
  );

  const { selectedDeployment: selected } = state;
  const prevSelected = usePrevious(selected);

  useEffect(() => {
    if (!selected || selected.id === prevSelected?.id) {
      return;
    }

    const upcomingDeploymentIds = state.upcomingDeployments.map(getId);
    const pastDeploymentIds = state.pastDeployments.map(getId);

    if (upcomingDeploymentIds.includes(selected.id) && !state.upcomingExpanded) {
      actions.setListExpanded(true);
      actions.setUpcomingExpanded(true);
    }

    if (pastDeploymentIds.includes(selected.id) && !state.pastExpanded) {
      actions.setPastExpanded(true);
    }
  }, [state, actions, selected, prevSelected]);

  return {
    app,
    service,
    deployments,
    deploymentsQuery,
    instances,
    totalDeployments,
    hasMoreDeployments,
    isLoadingMoreDeployments,
    loadMoreDeployments,
    ...state,
    ...actions,
  };
}

function useContextState(service: Service, deployments: ComputeDeployment[]): [state: State, Actions] {
  const [upcoming, active, past] = useDeploymentGroups(service, deployments);
  const sortedDeployments = [...upcoming, active, ...past].filter(isDefined);

  const isMobile = !useBreakpoint('md');

  const [listExpanded, setListExpanded] = useState(isMobile);
  const [upcomingExpanded, setUpcomingExpanded] = useState(isMobile || upcoming.length > 0);
  const [pastExpanded, setPastExpanded] = useState(isMobile);

  const [selectedDeployment, setSelectedDeployment] = useSelectedDeployment(sortedDeployments, isMobile);

  const onDeploymentSelected = useCallback(
    (deployment: ComputeDeployment) => {
      setSelectedDeployment(deployment);

      if (isMobile) {
        setListExpanded(false);
      } else {
        setListExpanded(true);
      }
    },
    [setSelectedDeployment, isMobile],
  );

  useObserve(upcoming.length, (length) => {
    if (length > 0) {
      setListExpanded(true);
      setUpcomingExpanded(true);
    }
  });

  return [
    {
      listExpanded,
      upcomingExpanded,
      pastExpanded,
      sortedDeployments,
      selectedDeployment,
      activeDeployment: active,
      upcomingDeployments: upcoming,
      pastDeployments: past,
    },
    {
      setListExpanded,
      setUpcomingExpanded,
      setPastExpanded,
      onDeploymentSelected,
    },
  ];
}

function useDeployments(service: Service) {
  const deploymentsQuery = useInfiniteQuery({
    queryKey: ['listDeployments', { serviceId: service.id }],
    initialPageParam: 0,
    async queryFn({ pageParam }) {
      const { count, deployments } = await api.listDeployments({
        query: {
          service_id: service.id,
          limit: String(10),
          offset: String(10 * pageParam),
          statuses: allApiDeploymentStatuses.filter((status) => status !== 'STASHED'),
        },
      });

      return {
        count: count!,
        deployments: deployments!.map(mapDeployment),
      };
    },
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      const nextPage = lastPageParam + 1;

      if (lastPage !== undefined && nextPage * 10 >= lastPage.count) {
        return undefined;
      }

      return nextPage;
    },
  });

  const pages = deploymentsQuery.data?.pages ?? [];
  const deployments = pages.flatMap((page) => page.deployments);

  const activeDeployment = useDeployment(service.activeDeploymentId);

  if (activeDeployment && !deployments.find(hasProperty('id', service.activeDeploymentId))) {
    deployments.push(activeDeployment);
  }

  return {
    deploymentsQuery,
    deployments,
    totalDeployments: pages[pages.length - 1]?.count ?? 0,
    hasMoreDeployments: deploymentsQuery.hasNextPage,
    isLoadingMoreDeployments: deploymentsQuery.isFetchNextPageError,
    loadMoreDeployments: () => void deploymentsQuery.fetchNextPage(),
  };
}

function useDeploymentGroups(service: Service, deployments: ComputeDeployment[]) {
  return useMemo(() => {
    let active: ComputeDeployment | undefined = undefined;
    const upcoming: ComputeDeployment[] = [];
    const past: ComputeDeployment[] = [];

    for (const deployment of deployments) {
      if (deployment.id === service.activeDeploymentId) {
        active = deployment;
      } else if (service.upcomingDeploymentIds?.includes(deployment.id) || isUpcomingDeployment(deployment)) {
        upcoming.push(deployment);
      } else {
        past.push(deployment);
      }
    }

    return [upcoming, active, past] as const;
  }, [service, deployments]);
}

function useSelectedDeployment(deployments: ComputeDeployment[], noDefaultSelected: boolean) {
  const selectedDeploymentId = useSearchParams().get('deploymentId');
  const navigate = useNavigate();

  const selectedDeployment = useDeployment(selectedDeploymentId ?? undefined);

  const setSelectedDeployment = useCallback(
    (deployment: ComputeDeployment) => {
      navigate({ search: (prev) => ({ ...prev, deploymentId: deployment.id }), replace: true });
    },
    [navigate],
  );

  useEffect(() => {
    if (noDefaultSelected) {
      return;
    }

    if (selectedDeploymentId === null && deployments[0] !== undefined) {
      setSelectedDeployment(deployments[0]);
    }
  }, [noDefaultSelected, deployments, selectedDeploymentId, setSelectedDeployment]);

  assert(selectedDeployment === undefined || isComputeDeployment(selectedDeployment));

  return [selectedDeployment, setSelectedDeployment] as const;
}

function useShortcuts(
  selectedIndex: number,
  setSelectedIndex: (index: number) => void,
  totalDeployments: number,
) {
  const selectPrevious = () => setSelectedIndex(selectedIndex - 1);
  const selectNext = () => setSelectedIndex(selectedIndex + 1);

  const canSelectPrevious = selectedIndex > 0;
  const canSelectNext = selectedIndex < totalDeployments - 1;

  useShortcut(['j'], canSelectNext ? selectNext : undefined);
  useShortcut(['ArrowDown'], canSelectNext ? selectNext : undefined);

  useShortcut(['k'], canSelectPrevious ? selectPrevious : undefined);
  useShortcut(['ArrowUp'], canSelectPrevious ? selectPrevious : undefined);
}
