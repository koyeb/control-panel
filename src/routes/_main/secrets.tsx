import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/secrets')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/secrets"!</div>
}
