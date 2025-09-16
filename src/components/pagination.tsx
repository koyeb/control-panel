import { useCallback, useEffect, useState } from 'react';

import { SvgComponent } from 'src/application/types';
import { IconChevronLeft, IconChevronRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.pagination');

export function Pagination({ pagination }: { pagination: ReturnType<typeof usePagination> }) {
  return (
    <div className="row justify-center gap-4">
      <PaginationButton
        label={<T id="previous" />}
        Start={IconChevronLeft}
        disabled={!pagination.hasPrevious}
        onClick={pagination.previous}
      />

      <PaginationButton
        label={<T id="next" />}
        End={IconChevronRight}
        disabled={!pagination.hasNext}
        onClick={pagination.next}
      />
    </div>
  );
}

type PaginationButtonProps = React.ComponentProps<'button'> & {
  label: React.ReactNode;
  Start?: SvgComponent;
  End?: SvgComponent;
};

function PaginationButton({ label, Start, End, ...props }: PaginationButtonProps) {
  return (
    <button
      type="button"
      className="group row items-center gap-1 text-link disabled:pointer-events-none disabled:opacity-50"
      {...props}
    >
      {Start && <Start className="size-em group-disabled:hidden" />}
      {label}
      {End && <End className="size-em group-disabled:hidden" />}
    </button>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePagination(initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hasNext, setHasNext] = useState(false);
  const hasPrevious = page > 1;

  return {
    page,
    pageSize,
    setPageSize,
    hasPrevious,
    hasNext,
    hasPages: hasPrevious || hasNext,
    query: {
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    },
    previous: useCallback(() => setPage((page) => (page > 0 ? page - 1 : page)), []),
    next: useCallback(() => setPage((page) => (hasNext ? page + 1 : page)), [hasNext]),
    useSync(query?: { hasNext: boolean }) {
      useEffect(() => {
        setHasNext(Boolean(query?.hasNext));
      }, [query?.hasNext]);
    },
  };
}
