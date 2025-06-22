import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/user/settings/organizations')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/user/settings/organizations"!</div>
}
