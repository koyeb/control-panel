import { useQuery } from '@tanstack/react-query';
import IconArrowUpRight from 'lucide-static/icons/arrow-up-right.svg?react';
import { FormattedDate } from 'react-intl';

import { BadgeNew } from 'src/components/badge-new';
import { LinkButton } from 'src/components/link';
import { QueryGuard } from 'src/components/query-error';
import { useLocalStorage } from 'src/hooks/storage';
import { Translate } from 'src/intl/translate';
import { unique } from 'src/utils/arrays';

const T = Translate.prefix('pages.home.news');

type News = {
  id: string;
  title: string;
  description: string;
  link: string;
  date: string;
};

export function News() {
  const [dismissedIds, setDismissedIds] = useLocalStorage<string[]>('dismissed-news');

  const query = useQuery({
    queryKey: ['news'],
    async queryFn(): Promise<News[]> {
      return [];
    },
    select: (news) => news.filter((news) => !dismissedIds?.includes(news.id)),
  });

  if (query.isSuccess && query.data.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    if (query.isSuccess) {
      setDismissedIds(unique([...(dismissedIds ?? []), ...query.data.map(({ id }) => id)]));
    }
  };

  return (
    <div className="xl:col hidden gap-3">
      <div className="row items-center justify-between gap-4">
        <span className="text-lg font-medium">
          <T id="title" />
        </span>
        <button className="text-link" onClick={handleDismiss}>
          <T id="dismissAll" />
        </button>
      </div>

      <QueryGuard query={query}>
        {(news) => (
          <ul className="col gap-2">
            {news.map((news) => (
              <NewsItem key={news.id} news={news} />
            ))}
          </ul>
        )}
      </QueryGuard>
    </div>
  );
}

function NewsItem({ news }: { news: News }) {
  return (
    <li className="card">
      <div className="row items-center gap-4 p-3">
        <div className="col gap-1">
          <div className="row items-center gap-1 font-medium">
            {news.title}
            <BadgeNew />
          </div>
          <div className="text-xs text-dim">{news.description}</div>
        </div>

        <LinkButton
          variant="ghost"
          size={1}
          component="a"
          href={news.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <T id="learnMore" />
          <div>
            <IconArrowUpRight className="size-4" />
          </div>
        </LinkButton>
      </div>

      <footer className="text-xs text-dim">
        <FormattedDate value={news.date} dateStyle="medium" />
      </footer>
    </li>
  );
}
