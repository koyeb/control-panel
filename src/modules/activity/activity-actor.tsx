import { z } from 'zod';

import { Activity } from 'src/api/model';
import { createValidationGuard } from 'src/application/create-validation-guard';
import LogoGreen from 'src/components/logo-green.svg?react';
import { GeneratedAvatar } from 'src/components/organization-avatar';

export function ActivityActorImage({ activity }: { activity: Activity }) {
  const actor = activity.actor;

  if (actor.type === 'system_user') {
    return <LogoGreen className="size-6 rounded-full border p-1" />;
  }

  if (isActorWithAvatar(actor)) {
    return <img src={actor.metadata.avatar_url} className="size-6 rounded-full" />;
  }

  return <GeneratedAvatar seed={actor.name} className="size-6 rounded-full" />;
}

const isActorWithAvatar = createValidationGuard(
  z.object({
    metadata: z.object({
      avatar_url: z.string(),
    }),
  }),
);
