import { z } from 'zod';

import { createValidationGuard } from 'src/application/create-validation-guard';
import { parseBytes } from 'src/application/memory';
import { entries, requiredDeep, snakeToCamelDeep, toObject } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import type { Api } from '../api-types';
import {
  Organization,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationQuotas,
  OrganizationSummary,
  User,
} from '../model';

export function mapUser({ user }: ApiEndpointResult<'getCurrentUser'>): User {
  return snakeToCamelDeep(requiredDeep(user!));
}

export function mapOrganization({ organization }: ApiEndpointResult<'getCurrentOrganization'>): Organization {
  return {
    ...snakeToCamelDeep(requiredDeep(organization!)),
    status: lowerCase(organization!.status!),
    statusMessage: lowerCase(organization!.status_message!),
    plan: organization!.plan! === 'hobby23' ? 'hobby' : organization!.plan!,
    hasSignupQualification: organization?.signup_qualification !== null,
    currentSubscriptionId: organization?.current_subscription_id || undefined,
    latestSubscriptionId: organization?.latest_subscription_id || undefined,
    billing: mapOrganizationBilling(organization!),
    trial: organization!.trialing ? { endsAt: organization!.trial_ends_at! } : undefined,
  };
}

export const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  postalCode: z.string(),
  city: z.string(),
  state: z.string().optional(),
  country: z.string(),
});

const isAddress = createValidationGuard(addressSchema);

function mapOrganizationBilling(organization: Api.Organization): Organization['billing'] {
  const address = {
    line1: organization.address1 || undefined,
    line2: organization.address2 || undefined,
    postalCode: organization.postal_code || undefined,
    city: organization.city || undefined,
    state: organization.state || undefined,
    country: organization.country || undefined,
  };

  return {
    name: organization.billing_name || undefined,
    email: organization.billing_email || undefined,
    address: isAddress(address) ? address : undefined,
    company: organization.company,
    vatNumber: organization.vat_number || undefined,
  };
}

export function mapInvitation({ invitation }: ApiEndpointResult<'getInvitation'>): OrganizationInvitation {
  return transformInvitation(invitation!);
}

export function mapInvitations({
  invitations,
}: ApiEndpointResult<'listInvitations'>): OrganizationInvitation[] {
  return invitations!.map(transformInvitation);
}

function transformInvitation(invitation: Api.OrganizationInvitation): OrganizationInvitation {
  return {
    ...snakeToCamelDeep(requiredDeep(invitation)),
    status: lowerCase(invitation.status!),
  };
}

export function mapOrganizationMembers({
  members,
}: ApiEndpointResult<'listOrganizationMembers'>): OrganizationMember[] {
  return members!.map((membership) => ({
    ...snakeToCamelDeep(requiredDeep(membership)),
    organization: {
      ...snakeToCamelDeep(requiredDeep(membership.organization!)),
      status: lowerCase(membership.organization!.status!),
    },
  }));
}

export function mapOrganizationSummary({
  summary,
}: ApiEndpointResult<'organizationSummary'>): OrganizationSummary {
  const freeInstances = Number(summary!.instances!.by_type!['free']);
  const freeDatabases = Number(summary!.neon_postgres!.by_instance_type!['free']);

  return {
    freeInstanceUsed: freeInstances > 0,
    freeDatabaseUsed: freeDatabases > 0,
    instancesUsed: toObject(
      entries(summary!.instances!.by_type!),
      ([key]) => String(key),
      ([, value]) => Number(value),
    ),
  };
}

export function mapOrganizationQuotas({
  quotas,
}: ApiEndpointResult<'organizationQuotas'>): OrganizationQuotas {
  return {
    maxNumberOfApps: Number(quotas?.apps),
    maxNumberOfServices: Number(quotas?.services),
    maxOrganizationMembers: Number(quotas?.max_organization_members),
    instanceTypes: quotas!.instance_types!.length > 0 ? quotas!.instance_types! : undefined,
    maxInstancesByType: toObject(
      Object.entries(quotas!.max_instances_by_type!),
      ([key]) => key,
      ([, value]) => Number(value),
    ),
    regions: quotas!.regions!.length > 0 ? quotas!.regions! : undefined,
    volumesByRegion: toObject(
      Object.entries(quotas!.persistent_volumes_by_region!),
      ([key]) => key,
      ([, value]) => ({
        maxVolumeSize: parseBytes(`${value.max_volume_size}GB`),
        maxTotalSize: parseBytes(`${value.max_total_size}GB`),
      }),
    ),
    maxMemory: parseBytes(`${quotas!.memory_mb}MiB`),
    maxDomains: Number(quotas!.custom_domains),
    logsRetention: Number(quotas!.logs_retention),
  };
}
