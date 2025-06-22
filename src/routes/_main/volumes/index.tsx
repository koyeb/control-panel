import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/volumes/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/volumes/"!</div>
}
