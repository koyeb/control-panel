import { useUser } from 'src/api/hooks/session';

import imgCongrats1 from '../images/congrats-1.png';
import imgCongrats2 from '../images/congrats-2.png';
import FacebookIcon from '../images/facebook.svg?react';
import LinkedinIcon from '../images/linkedin.svg?react';
import TwitterIcon from '../images/twitter.svg?react';
import { WrappedData } from '../wrapped-data';

export function Recap({ data, next }: { data: WrappedData; next: () => void }) {
  const user = useUser();

  const imageUrl = `https://wrapped-koyeb-516b9924.koyeb.app/${data.createdServices};${data.deployments};${data.buildTime};${data.requests};${data.regions.join(',')}`;

  return (
    <div onClick={next} className="col h-full justify-between gap-4 text-center text-3xl font-semibold">
      <img src={imgCongrats1} className="max-w-64" />

      <div className="col gap-4">
        <p>That was something!</p>
        <p className="text-2xl">2024 will be remembered, right {user.name}?</p>
      </div>

      <img src={imgCongrats2} />

      <div className="text-lg">Share with the world!</div>
      <div className="row justify-evenly gap-4 text-lg">
        {links.map(({ name, Icon, shareUrl }) => (
          <button
            key={name}
            type="button"
            title={`Share on ${name}`}
            onClick={() => window.open(shareUrl(`Check out my Koyeb stats for 2024!\n${imageUrl}`))}
          >
            <Icon className="size-6" />
          </button>
        ))}
      </div>
    </div>
  );
}

const links: Array<{
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
  shareUrl: (url: string) => string;
}> = [
  {
    name: 'Twitter',
    Icon: TwitterIcon,
    shareUrl(url) {
      return `https://twitter.com/intent/tweet/?${new URLSearchParams({ url }).toString()}`;
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
