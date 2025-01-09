import { useRegions } from 'src/api/hooks/catalog';
import { useUser } from 'src/api/hooks/session';

import imgCongrats1 from '../images/congrats-1.png';
import FacebookIcon from '../images/facebook.svg?react';
import LinkedinIcon from '../images/linkedin.svg?react';
import TwitterIcon from '../images/twitter.svg?react';
import { WrappedData } from '../wrapped-data';

export function Recap({ data, next }: { data: WrappedData; next: () => void }) {
  const user = useUser();
  const regions = useRegions().filter((region) => data.regions.includes(region.identifier));

  const baseUrl = 'https://koyeb-wrapped.koyeb.app';
  const pathname = `${data.createdServices};${data.deployments};${data.buildTime};${data.requests};${regions.map((region) => regionMap[region.identifier]).join(',')}`;

  return (
    <div onClick={next} className="col h-full justify-between gap-4 text-center text-3xl font-semibold">
      <img src={imgCongrats1} className="max-w-56" />

      <div className="col gap-4">
        <p>That was something!</p>
        <p className="text-2xl">2024 will be remembered, right {user.name}?</p>
      </div>

      <img src={`${baseUrl}/${pathname}`} className="rounded-lg shadow-xl" />

      <div className="text-lg">Share with the world!</div>
      <div className="row justify-evenly gap-4 text-lg" onClick={(event) => event.preventDefault()}>
        {links.map(({ name, Icon, shareUrl }) => (
          <button
            key={name}
            type="button"
            title={`Share on ${name}`}
            className="text-dim transition-transform hover:scale-125 hover:text-black"
            onClick={(event) => {
              event.stopPropagation();
              window.open(shareUrl('Check out my Koyeb stats for 2024!', `${baseUrl}/share/${pathname}`));
            }}
          >
            <Icon className="size-6" />
          </button>
        ))}
      </div>
    </div>
  );
}

const regionMap: Record<string, number> = {
  fra: 0,
  par: 1,
  sfo: 2,
  sin: 3,
  tyo: 4,
  was: 5,
};

const links: Array<{
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  shareUrl: (text: string, url: string) => string;
}> = [
  {
    name: 'Twitter',
    Icon: TwitterIcon,
    shareUrl(text, url) {
      return `https://twitter.com/intent/tweet/?${new URLSearchParams({ text, url }).toString()}`;
    },
  },
  {
    name: 'Facebook',
    Icon: FacebookIcon,
    shareUrl(url) {
      return `https://www.facebook.com/sharer/sharer.php?${new URLSearchParams({ u: url }).toString()}`;
    },
  },
  {
    name: 'LinkedIn',
    Icon: LinkedinIcon,
    shareUrl(url) {
      return `https://linkedin.com/shareArticle?${new URLSearchParams({ url, mini: 'true' })}`;
    },
  },
];
