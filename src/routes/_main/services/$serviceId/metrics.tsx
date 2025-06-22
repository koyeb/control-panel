import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/services/$serviceId/metrics')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/service/metrics"!</div>
}
