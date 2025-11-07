import { useService } from 'src/api';
import { Title } from 'src/components/title';

export function SandboxDetails({ serviceId }: { serviceId: string }) {
  const service = useService(serviceId);

  return (
    <>
      <Title title={service?.name} />
    </>
  );
}
