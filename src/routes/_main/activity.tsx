import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/activity')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/activity"!</div>
}
