import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { add, endOfMonth, format, isBefore, isEqual, startOfMonth, sub } from 'date-fns';
import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { useForm } from 'react-hook-form';
import { FormattedDate, FormattedNumber } from 'react-intl';

import { Button, Dialog, Tooltip } from '@koyeb/design-system';
import { useNextInvoiceQuery } from 'src/api/hooks/billing';
import { useOrganization } from 'src/api/hooks/session';
import { InvoiceDiscount, InvoicePeriod } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { downloadFileFromString } from 'src/application/download-file-from-string';
import { ControlledSelect } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, Translate, TranslateEnum } from 'src/intl/translate';
import { removeTimezoneOffset } from 'src/utils/date';

const T = createTranslate('pages.organizationSettings.billing.usage');

export function Usage() {
  const organization = useOrganization();
  const invoiceQuery = useNextInvoiceQuery();

  return (
    <section className="col gap-6">
      <SectionHeader
        title={<T id="title" />}
        description={
          <>
            <T
              id={organization.trial ? 'descriptionTrial' : 'description'}
              values={{
                strong: (children) => <strong className="text-default">{children}</strong>,
                plan: <TranslateEnum enum="plans" value={organization.plan} />,
                upgrade: <T id="upgrade" />,
              }}
            />
          </>
        }
      />

      {invoiceQuery.isSuccess && <UsageDetails {...invoiceQuery.data} />}

      <DownloadUsage />
    </section>
  );
}

type UsageDetailsProps = {
  periods: InvoicePeriod[];
  discounts: InvoiceDiscount[];
  totalWithoutDiscount?: number;
  total: number;
};

function UsageDetails({ periods, discounts, totalWithoutDiscount, total }: UsageDetailsProps) {
  if (periods.length === 0 && discounts.length === 0) {
    return (
      <p>
        <T id="noUsage" />
      </p>
    );
  }

  return (
    <div className="col rounded-md border">
      {periods.map(({ start, end, lines }, index) => (
        <Fragment key={start}>
          <div className={clsx('row bg-muted px-3 py-2 text-xs text-dim', index === 0 && 'rounded-t-md')}>
            <Period start={start} end={end} />
          </div>

          {lines.map((props) => (
            <Fragment key={props.label}>
              <UsageDetailsRowMobile {...props} />
              <UsageDetailsRowDesktop {...props} />
            </Fragment>
          ))}
        </Fragment>
      ))}

      <div className="divide-y">
        {totalWithoutDiscount !== undefined && (
          <UsageTotalRow label={<T id="subtotal" />}>
            <Price value={totalWithoutDiscount / 100} />
          </UsageTotalRow>
        )}

        {discounts.map((discount) => (
          <UsageTotalRow key={discount.label} label={discount.label} className="text-green">
            <DiscountValue discount={discount} />
          </UsageTotalRow>
        ))}

        <UsageTotalRow label={<T id="total" />}>
          <Price value={total / 100} />
        </UsageTotalRow>
      </div>
    </div>
  );
}

type PeriodProps = {
  start: string;
  end: string;
};

function Period({ start, end }: PeriodProps) {
  return (
    <T
      id="startEnd"
      values={{
        start: <FormattedDate key="start" value={start} year="numeric" month="long" day="2-digit" />,
        end: <FormattedDate key="end" value={end} year="numeric" month="long" day="2-digit" />,
      }}
    />
  );
}

type UsageDetailsRowProps = {
  label: string;
  usage?: number;
  price?: number;
  total: number;
};

function UsageDetailsRowDesktop({ label, usage, price, total }: UsageDetailsRowProps) {
  return (
    <div className="sm:row hidden items-center border-b px-3 py-2">
      <div className="w-64">{label}</div>

      <div className="w-48 justify-end px-4 text-right">
        <UsageRowTime time={usage} />
      </div>

      <div className="px-4 text-dim">
        <UsageRowPrice price={price} />
      </div>

      <div className="ml-auto justify-end">
        <UsageRowTotal total={total} />
      </div>
    </div>
  );
}

function UsageDetailsRowMobile({ label, usage, price, total }: UsageDetailsRowProps) {
  return (
    <div className="col gap-2 border-b p-4 sm:hidden">
      <div>{label}</div>

      <div className="row">
        <UsageRowTime time={usage} />
        <div className="ml-auto">
          <UsageRowTotal total={total} />
        </div>
      </div>

      <div className="text-dim">
        <UsageRowPrice price={price} />
      </div>
    </div>
  );
}

type UsageRowTimeProps = {
  time?: number;
};

function UsageRowTime({ time }: UsageRowTimeProps) {
  if (!time) {
    return null;
  }

  return (
    <Tooltip allowHover content={<T id="usageSeconds" values={{ seconds: time }} />}>
      {(props) => (
        <span {...props}>
          <FormattedDuration seconds={time} />
        </span>
      )}
    </Tooltip>
  );
}

type UsageRowPriceProps = {
  price?: number;
};

function UsageRowPrice({ price }: UsageRowPriceProps) {
  if (!price) {
    return null;
  }

  return (
    <T id="pricePerHour" values={{ price: <FormattedPrice value={(price * 60 * 60) / 100} digits={6} /> }} />
  );
}

type UsageRowTotalProps = {
  total: number;
};

function UsageRowTotal({ total }: UsageRowTotalProps) {
  return <Price value={total / 100} />;
}

type UsageTotalRowProps = {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function UsageTotalRow({ className, label, children }: UsageTotalRowProps) {
  return (
    <div className={clsx('row items-center justify-end px-3 py-2', className)}>
      <span className="mr-4">{label}</span>
      {children}
    </div>
  );
}

type DiscountValueProps = {
  discount: InvoiceDiscount;
};

function DiscountValue({ discount }: DiscountValueProps) {
  if (discount.type === 'amountOff') {
    return <Price value={-discount.value / 100} />;
  }

  if (discount.type === 'percentOff') {
    return (
      <span className="font-medium">
        <FormattedNumber style="percent" value={-discount.value / 100} />
      </span>
    );
  }

  return null;
}

function Price(props: React.ComponentProps<typeof FormattedPrice>) {
  return (
    <span className="font-medium">
      <FormattedPrice {...props} />
    </span>
  );
}

type FormattedDurationProps = {
  seconds: number;
};

function FormattedDuration({ seconds: value }: FormattedDurationProps) {
  return <T id="hoursMinutesSeconds" values={secondsToHMS(value)} />;
}

function secondsToHMS(seconds: number) {
  return {
    seconds: String(Math.floor(seconds % 60)).padStart(2, '0'),
    minutes: String(Math.floor((seconds / 60) % 60)).padStart(2, '0'),
    hours: String(Math.floor(seconds / (60 * 60))).padStart(2, '0'),
  };
}

function DownloadUsage() {
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      period: '',
    },
  });

  const mutation = useMutation({
    ...useApiMutationFn('getUsageCsv', ({ period }: FormValues<typeof form>) => {
      const { start, end } = getStartEnd(period);

      return {
        header: { Accept: 'text/csv' },
        query: {
          starting_time: start.toISOString(),
          ending_time: end.toISOString(),
        },
      };
    }),
    onSuccess(result, { period }) {
      const { start, end } = getStartEnd(period);
      const filename = `koyeb-usage-${format(start, 'yyyy-MM')}-${format(end, 'yyyy-MM')}.csv`;

      downloadFileFromString(filename, result as string);
    },
  });

  return (
    <>
      <Button color="gray" className="self-start" onClick={() => setOpen(true)}>
        <T id="downloadUsage" />
      </Button>

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onClosed={() => form.reset()}
        width="lg"
        title={<T id="downloadUsageDialog.title" />}
        description={<T id="downloadUsageDialog.description" />}
      >
        <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
          <ControlledSelect
            control={form.control}
            name="period"
            items={getPeriods()}
            placeholder="Select a period"
            getKey={(date) => date.toISOString()}
            itemToString={(date) => date.toString()}
            itemToValue={(date) => date.toISOString()}
            renderItem={(date) => <FormattedDate value={date} month="long" year="numeric" />}
          />

          <footer className="row justify-end gap-2">
            <Button color="gray" variant="ghost" onClick={() => setOpen(false)}>
              <Translate id="common.close" />
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              <T id="downloadUsageDialog.submit" />
            </Button>
          </footer>
        </form>
      </Dialog>
    </>
  );
}

function getPeriods() {
  const now = new Date();
  const periods: Date[] = [];

  let date = startOfMonth(sub(now, { years: 2 }));

  while (isBefore(date, now) || isEqual(date, now)) {
    periods.push(date);
    date = add(date, { months: 1 });
  }

  return periods.reverse();
}

function getStartEnd(period: string) {
  const start = removeTimezoneOffset(new Date(period));
  const end = removeTimezoneOffset(endOfMonth(new Date(period)));
  const now = new Date();

  return {
    start,
    end: isBefore(end, now) ? end : now,
  };
}
