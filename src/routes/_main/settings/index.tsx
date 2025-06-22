import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/settings/"!</div>
}
