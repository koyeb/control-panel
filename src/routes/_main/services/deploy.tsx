import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/services/deploy')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/services/deploy"!</div>
}
