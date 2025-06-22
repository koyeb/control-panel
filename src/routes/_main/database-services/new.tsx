import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/database-services/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/database-services/new"!</div>
}
