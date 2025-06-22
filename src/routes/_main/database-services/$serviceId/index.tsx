import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/database-services/$serviceId/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/database/"!</div>
}
