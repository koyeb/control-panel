import { useCatalogRegion } from 'src/api';

type RegionNameProps = React.HTMLAttributes<HTMLDivElement> & {
  regionId?: string;
};

export function RegionName({ regionId, ...props }: RegionNameProps) {
  const region = useCatalogRegion(regionId);

  return <div {...props}>{region?.name}</div>;
}
