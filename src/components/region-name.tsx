import { useRegion } from 'src/api/hooks/catalog';

type RegionNameProps = React.HTMLAttributes<HTMLDivElement> & {
  identifier: string;
};

export function RegionName({ identifier, ...props }: RegionNameProps) {
  const region = useRegion(identifier);

  return <div {...props}>{region?.displayName}</div>;
}
