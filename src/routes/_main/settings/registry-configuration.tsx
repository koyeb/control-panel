import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/settings/registry-configuration')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings/registry-configuration"!</div>
}
