import { z } from 'zod';

import { createValidationGuard } from 'src/application/create-validation-guard';
import { parseBytes } from 'src/application/memory';
import { toObject } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import { ApiOrganization, ApiOrganizationInvitation } from '../api-types';
import {
  Organization,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationQuotas,
  OrganizationSummary,
  User,
} from '../model';

export function mapUser({ user }: ApiEndpointResult<'getCurrentUser'>): User {
  return {
    id: user!.id!,
    name: user!.name!,
    email: user!.email!,
    emailValidated: user!.email_validated!,
    avatarUrl: user!.avatar_url!,
    githubUser: user!.github_user,
    flags: user!.flags!,
  };
}

export function mapOrganization({ organization }: ApiEndpointResult<'getCurrentOrganization'>): Organization {
  return {
    id: organization!.id!,
    name: organization!.name!,
    status: lowerCase(organization!.status!),
    statusMessage: lowerCase(organization!.status_message!),
    plan: organization!.plan! === 'hobby23' ? 'hobby' : organization!.plan!,
    hasSignupQualification: organization?.signup_qualification !== null,
    signupQualification: organization?.signup_qualification,
    currentSubscriptionId: organization?.current_subscription_id || undefined,
    latestSubscriptionId: organization?.latest_subscription_id || undefined,
    hasPaymentMethod: organization!.has_payment_method!,
    billing: mapOrganizationBilling(organization!),
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

function mapOrganizationBilling(organization: ApiOrganization): Organization['billing'] {
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

function transformInvitation(invitation: ApiOrganizationInvitation): OrganizationInvitation {
  return {
    id: invitation.id!,
    status: lowerCase(invitation.status!),
    organization: {
      id: invitation.organization!.id!,
      name: invitation.organization!.name!,
    },
    invitee: {
      email: invitation.email!,
    },
    inviter: {
      name: invitation.inviter!.name!,
      email: invitation.inviter!.email!,
      avatarUrl: invitation.inviter!.avatar_url!,
    },
  };
}

export function mapOrganizationMembers({
  members,
}: ApiEndpointResult<'listOrganizationMembers'>): OrganizationMember[] {
  return members!.map((membership) => ({
    id: membership.id!,
    member: {
      id: membership.user!.id!,
      name: membership.user!.name!,
      email: membership.user!.email!,
      avatarUrl: membership.user!.avatar_url!,
    },
    organization: {
      id: membership.organization!.id!,
      name: membership.organization!.name!,
      status: lowerCase(membership.organization!.status!),
    },
    joinedAt: membership.joined_at!,
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
  };
}

export function mapOrganizationQuotas({
  quotas,
}: ApiEndpointResult<'organizationQuotas'>): OrganizationQuotas {
  return {
    maxNumberOfApps: Number(quotas?.apps),
    maxNumberOfServices: Number(quotas?.services),
    maxOrganizationMembers: Number(quotas?.max_organization_members),
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
    maxMemory: Number(quotas!.memory_mb),
    maxDomains: Number(quotas!.domains),
  };
}
