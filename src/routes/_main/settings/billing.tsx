import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/settings/billing')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings/billing"!</div>
}
