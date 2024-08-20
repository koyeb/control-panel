import { useId, useMemo } from 'react';

import { useGithubApp } from 'src/api/hooks/git';
import { useOrganizationUnsafe } from 'src/api/hooks/session';

const useGithubAvatar = false;

type OrganizationAvatarProps = {
  organizationName?: string;
  className?: string;
};

export function OrganizationAvatar({ organizationName, className }: OrganizationAvatarProps) {
  const organization = useOrganizationUnsafe();
  const githubApp = useGithubApp();

  if (!useGithubAvatar || !githubApp) {
    return <GeneratedAvatar seed={organizationName ?? organization?.name ?? ''} className={className} />;
  }

  return <img src={`https://github.com/${githubApp.organizationName}.png?size=24`} className={className} />;
}

type GeneratedAvatarProps = {
  seed: string;
  className?: string;
};

export function GeneratedAvatar({ seed, className }: GeneratedAvatarProps) {
  const id = useId();
  const color1 = useMemo(() => stringToColor(seed), [seed]);
  const color2 = useMemo(() => invertColor(color1), [color1]);

  const initials = seed
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <svg viewBox="0 0 24 24" className={className}>
      <defs>
        <linearGradient id={id} x1={0} y1={1} x2={1} y2={0}>
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={24} height={24} className="fill-white" />
      <rect x={0} y={0} width={24} height={24} fill={`url(#${id})`} opacity={0.6} />

      <text fontSize="0.9em" x="50%" y="50%" dominantBaseline="central" textAnchor="middle">
        {initials}
      </text>
    </svg>
  );
}

function stringToColor(input: string) {
  let value = input
    .split('')
    .map((letter) => letter.charCodeAt(0))
    .reduce((a, b) => (a * b) % (1 << 24), 1);

  if (value === 0) {
    value = 1;
  }

  while (value < 1 << 24) {
    value *= value + 1;
  }

  value = value % (1 << 24);

  return '#' + value.toString(16).toUpperCase().padStart(6, '0');
}

function invertColor(input: string) {
  const color = 0xffffff ^ parseInt(input.substring(1), 16);
  return '#' + color.toString(16).slice(-6).padStart(6, '0');
}
