import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/team')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/team"!</div>
}
