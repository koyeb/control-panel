import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/settings/api')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings/api"!</div>
}
