import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/volumes/snapshots')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/volumes/snapshots"!</div>
}
