import { useQuery } from '@tanstack/react-query';
import { FormattedDate } from 'react-intl';

import { container } from 'src/application/container';
import { BadgeNew } from 'src/components/badge-new';
import { ExternalLinkButton } from 'src/components/link';
import { IconArrowUpRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { TOKENS } from 'src/tokens';
import { unique } from 'src/utils/arrays';
import { getConfig } from 'src/utils/config';

const T = createTranslate('pages.home.news');

type News = {
  id: string;
  title: string;
  description: string;
  link: string;
  date: string;
};

const storage = container.resolve(TOKENS.storage);
const dismissedIds = storage.value<string[]>('dismissed-news');

export function News() {
  const query = useQuery({
    queryKey: ['news'],
    refetchInterval: false,
    meta: { showError: false },
    async queryFn(): Promise<News[]> {
      const websiteUrl = getConfig('websiteUrl');
      const url = new URL('/api/news.json', websiteUrl);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json() as Promise<News[]>;
    },
    select: (news) => news.filter((news) => !dismissedIds.read()?.includes(news.id)),
  });

  if (query.error || (query.isSuccess && query.data.length === 0)) {
    return null;
  }

  const handleDismiss = () => {
    if (query.isSuccess) {
      dismissedIds.write(unique([...(dismissedIds.read() ?? []), ...query.data.map(({ id }) => id)]));
      void query.refetch();
    }
  };

  if (!query.isSuccess) {
    return null;
  }

  return (
    <div className="hidden gap-3 xl:col">
      <div className="row items-center justify-between gap-4">
        <span className="text-lg font-medium">
          <T id="title" />
        </span>
        <button className="text-link" onClick={handleDismiss}>
          <T id="dismissAll" />
        </button>
      </div>

      <ul className="col gap-2">
        {query.data.map((news) => (
          <NewsItem key={news.id} news={news} />
        ))}
      </ul>
    </div>
  );
}

function NewsItem({ news }: { news: News }) {
  return (
    <li className="card">
      <div className="row items-center justify-between gap-4 p-3">
        <div className="col gap-1">
          <div className="row items-center gap-1 font-medium">
            {news.title}
            <BadgeNew />
          </div>
          <div className="text-xs text-dim">{news.description}</div>
        </div>

        <ExternalLinkButton openInNewTab variant="ghost" size={1} href={news.link}>
          <T id="learnMore" />
          <div>
            <IconArrowUpRight className="size-4" />
          </div>
        </ExternalLinkButton>
      </div>

      <footer className="text-xs text-dim">
        <FormattedDate value={news.date} dateStyle="medium" />
      </footer>
    </li>
  );
}
