import { createElement } from 'react';

type TitleProps = {
  as?: 'h1' | 'h2';
  title: React.ReactNode;
  end?: React.ReactNode;
};

export function Title({ as, title, end }: TitleProps) {
  return (
    <div className="row flex-wrap gap-4">
      {createElement(as ?? 'h1', { className: 'typo-heading' }, title)}
      {end && <div className="ml-auto">{end}</div>}
    </div>
  );
}
