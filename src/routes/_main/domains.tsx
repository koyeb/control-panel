import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/domains')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/domains"!</div>
}
