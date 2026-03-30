# Data Model

TypeScript types for all domain entities are defined in `src/model.ts`.

Models are mapped from the OpenAPI spec via `src/api/api.generated.d.ts`. Most use simple snake_case <-> camelCase conversions; others include custom transformations to simplify frontend code. Transformations are used sparingly to keep abstractions lean.

All properties are marked optional in the generated API types (from the OpenAPI spec). The frontend data model enforces type safety by making certain API properties non-optional when they're guaranteed to be present. When unsure whether a property should be optional, ask the backend team.

## Account & Organization

- **User** — Authenticated user with profile and feature flags.
- **Organization** — Workspace containing apps, members, and billing configuration.
- **OrganizationMember** — User belonging to an organization with join metadata.
- **OrganizationQuotas** — Resources limits per organization.
- **OrganizationSummary** — Resource usage statistics and free tier tracking.
- **OrganizationInvitation** — Pending membership invitation with status tracking.

## Subscription & Billing

- **Subscription** — Billing state with payment status and trial spending limits.
- **Invoice** — Monthly billing statement with line items and period breakdown.

## Catalog

- **CatalogDatacenter** — Physical infrastructure location for latency measurements.
- **CatalogRegion** — Geographic deployment region with availability and instance support.
- **CatalogInstance** — Compute instance type with specifications, regional info and pricing.

## Compute

- **Project** — Organizational container grouping apps for billing and access.
- **App** — Collection of services accessible via domains.
- **AppsFull** — App with associated services and latest / active deployments.
- **Service** — Deployable resource (web, worker, sandbox, or database).
- **ComputeDeployment** — Service configuration snapshot.
- **Replica** — Collection of instances in a region with horizontal scaling index.
- **Instance** — Individual running container instance.

## Databases

- **DatabaseDeployment** — PostgreSQL database with configuration and operational state.
- **DatabaseRole** — PostgreSQL user account with credentials (stored in a secret).
- **LogicalDatabase** — Database within PostgreSQL deployment under named owner.

## Git

- **GithubApp** — GitHub integration enabling repository indexing.
- **GitRepository** — Git repository metadata.

## Volumes

- **Volume** — Persistent block storage attachable to services.
- **VolumeSnapshot** — Point-in-time volume backup for migration or recovery.

## Domains

- **Domain** — DNS domain with verification status and CNAME configuration.
- **AppDomain** — Domain assigned to app for external HTTP access.

## Secrets

- **Secret** — Encrypted value which can be referenced in environment variables.
- **RegistrySecret** — Private container registry authentication credentials.

## One-Click Apps

- **OneClickApp** — Pre-configured application template for one-click deployment.
- **AiModel** — AI model one-click app.
