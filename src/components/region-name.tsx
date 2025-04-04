import { useRegion } from 'src/api/hooks/catalog';

type RegionNameProps = React.HTMLAttributes<HTMLDivElement> & {
  regionId?: string;
};

export function RegionName({ regionId, ...props }: RegionNameProps) {
  const region = useRegion(regionId);

  return <div {...props}>{region?.name}</div>;
}
