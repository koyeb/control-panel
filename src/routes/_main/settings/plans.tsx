import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/settings/plans')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings/plans"!</div>
}
