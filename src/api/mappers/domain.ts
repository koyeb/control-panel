import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import type { Api } from '../api-types';
import { Domain } from '../model';

export function mapDomains({ domains }: ApiEndpointResult<'listDomains'>): Domain[] {
  return domains!.map(transformDomain);
}

export function mapDomain({ domain }: ApiEndpointResult<'createDomain'>): Domain {
  return transformDomain(domain!);
}

function transformDomain(domain: Api.Domain): Domain {
  return {
    id: domain.id!,
    appId: domain.app_id === '' ? null : domain.app_id!,
    name: domain.name!,
    intendedCname: domain.intended_cname!,
    type: lowerCase(domain.type!),
    status: lowerCase(domain.status!),
    messages: domain.messages!,
    verifiedAt: domain.verified_at ?? null,
    createdAt: domain.created_at!,
    updatedAt: domain.updated_at!,
  };
}
