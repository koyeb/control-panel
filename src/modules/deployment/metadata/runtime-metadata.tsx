import { Badge, Tooltip } from '@koyeb/design-system';
import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { useVolumes } from 'src/api/hooks/volume';
import { DeploymentDefinition, EnvironmentVariable, type Scaling } from 'src/api/model';
import { Metadata } from 'src/components/metadata';
import { RegionFlag } from 'src/components/region-flag';
import { RegionsList } from 'src/components/regions-list';
import { Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

const T = Translate.prefix('deploymentInfo');

export function InstanceTypeMetadata({ instanceType }: { instanceType: string }) {
  const instance = useInstance(instanceType);

  return <Metadata label={<T id="instanceTypeLabel" />} value={instance?.displayName} />;
}

export function ScalingMetadata({ scaling }: { scaling: Scaling }) {
  const value = () => {
    if (scaling.type === 'fixed') {
      return <T id="fixedScalingValue" values={{ instances: scaling.instances }} />;
    }

    return <T id="autoScalingValue" values={{ min: scaling.min, max: scaling.max }} />;
  };

  return <Metadata label={<T id="scalingLabel" />} value={value()} />;
}

export function RegionsMetadata({ regions }: { regions: string[] }) {
  const [firstRegion, ...otherRegions] = regions;
  const catalogRegions = useRegions();

  if (!firstRegion) {
    return null;
  }

  const catalogRegion = catalogRegions.find(hasProperty('identifier', firstRegion));

  return (
    <Metadata
      label={<T id="regionsLabel" />}
      value={
        <div className="row items-center gap-2">
          <RegionFlag identifier={firstRegion} className="size-4 rounded-full shadow-badge" />

          {catalogRegion?.displayName}

          {otherRegions.length > 0 && (
            <Tooltip content={<RegionsList identifiers={otherRegions} />}>
              {(props) => (
                <Badge size={1} {...props}>
                  <Translate id="common.plusCount" values={{ count: otherRegions.length }} />
                </Badge>
              )}
            </Tooltip>
          )}
        </div>
      }
    />
  );
}

export function EnvironmentVariablesMetadata({ definition }: { definition: DeploymentDefinition }) {
  const { environmentVariables } = definition;

  const content = () => {
    if (environmentVariables.length === 0) {
      return null;
    }

    return (
      <div className="whitespace-nowrap">
        {environmentVariables.map(formatEnvironmentVariable).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Metadata
      label={<T id="environmentVariablesLabel" />}
      value={
        <Tooltip allowHover content={content()} className="max-w-md">
          {(props) => (
            <span {...props}>
              <T id="environmentVariablesValue" values={{ count: environmentVariables.length }} />
            </span>
          )}
        </Tooltip>
      }
    />
  );
}

function formatEnvironmentVariable({ name, value }: EnvironmentVariable) {
  return `${name}=${value}`;
}

export function VolumesMetadata({ definition }: { definition: DeploymentDefinition }) {
  const { volumes: attachedVolumes } = definition;
  const volumes = useVolumes();

  const content = () => {
    if (attachedVolumes.length === 0) {
      return null;
    }

    return (
      <div className="whitespace-nowrap">
        {attachedVolumes.map(({ volumeId, mountPath }) => (
          <div key={volumeId} className="truncate">
            <T
              id="attachedVolume"
              values={{
                volumeName: volumes?.find(hasProperty('id', volumeId))?.name,
                mountPath,
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Metadata
      label={<T id="volumesLabel" />}
      value={
        <Tooltip allowHover content={content()} className="max-w-md">
          {(props) => (
            <span {...props}>
              <T id="volumesValue" values={{ count: attachedVolumes.length }} />
            </span>
          )}
        </Tooltip>
      }
    />
  );
}
