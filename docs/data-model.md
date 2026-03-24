# Data Model

TypeScript types for all domain entities are defined in `src/model.ts`. Most types are mapped directly from the OpenAPI spec via `src/api/api.generated.d.ts`.

### Account & Organization

- **User** — Team member with email, avatar, and feature flags
- **Organization** — Workspace container with plan, billing, and status
- **OrganizationQuotas** — Hard limits per org: max projects, services, members; instance types allowed; regions allowed; volume size/count; memory; domain count; log retention; scale-to-zero settings
- **OrganizationSummary** — Quota usage summary: free resources used, instance type counts
- **OrganizationInvitation** — Invitation to join organization with status (PENDING, ACCEPTED, EXPIRED)
- **OrganizationMember** — User membership in organization with join date

### Subscription & Billing

- **Subscription** — Active subscription with trial info (spend tracking) and payment failure status
- **Invoice** — Billing invoice with line items (plan and usage charges) and discounts (percent or amount off)

### Compute

- **Project** — Namespace grouping services within an organization
- **App** — Collection of related services on domains
- **AppsFull** — List of list + service map + latest/active deployments per app (home page)
- **Service** — Workload (web, worker, database) with deployments
- **Deployment** — Versioned snapshot of a service (git repo, Docker image, or archive) with status tracking
- **Instance** — Running container replica in a region for a service

### Databases

- **DatabaseDeployment** — PostgreSQL instance backed by Neon with version, region, host, roles, logical databases, and quota tracking (active time, compute time, disk)
- **DatabaseRole** — Database user account with name and secret ID for connection credentials
- **LogicalDatabase** — Database within PostgreSQL instance with owner and name

### Catalog

- **CatalogInstance** — Available instance type (eco, standard, gpu) with vCPU, memory, disk, pricing, and availability per region
- **CatalogRegion** — Available region, instance availability, and scope (continental, metropolitan)
- **CatalogDatacenter** — Available datacenters, used to show the regions latencies

### Git

- **GitRepository** — Git repo with branches, default branch, privacy, and last push date
- **GithubApp** — GitHub app installation tied to organization with indexing status

### Volumes

- **Volume** — Persistent storage (ATTACHED, DETACHED, or ARCHIVING) attached to services
- **VolumeSnapshot** — Snapshot of a volume for backup/recovery (LOCAL or REMOTE)

### Domains

- **Domain** — Custom or auto-assigned domain with CNAME configuration and status (PENDING, ACTIVE, ERROR)

### Secrets

- **Secret** — Stored credential (SIMPLE, REGISTRY, or MANAGED) for deployment use
- **RegistrySecret** — Registry credentials for docker-hub, GitHub, GitLab, Azure, GCP, or private registries

### One-Click Apps

- **OneClickApp** — Pre-configured app template with environment variables, volumes, deployment definition
- **OneClickAppEnv** — Environment variable with type (string, number, boolean, select) and optional constraints
- **AiModel** — Pre-configured AI/ML model for sandbox deployments with min vRAM and Docker image

## Relationships

```
Organization
├─ Project
│  ├─ App
│  │  ├─ Service (web, worker, database)
│  │  │  ├─ Deployment (latest, active)
│  │  │  │  ├─ Instance (by region/replica)
│  │  │  │  └─ Build (with steps)
│  │  │  └─ Volume
│  │  └─ Domain
│  └─ Activity (audit log)
├─ User (members)
├─ Secret (credentials)
└─ Subscription + Invoice (billing)
```

## Notes

- All API data are declared as optional, this model makes some properties correctly typed
- All timestamps are ISO 8601 strings (e.g., `"2026-03-24T12:00:00Z"`)
- IDs are UUIDs
- Status enums are typically uppercase (PENDING, ACTIVE, etc.)
