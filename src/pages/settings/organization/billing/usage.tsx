import { Button, Tooltip } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { add, endOfMonth, format, isBefore, isEqual, startOfMonth, sub } from 'date-fns';
import { useForm } from 'react-hook-form';
import { FormattedDate, FormattedNumber } from 'react-intl';
import { Fragment } from 'react/jsx-runtime';

import { apiMutation, useNextInvoiceQuery, useOrganization } from 'src/api';
import { downloadFileFromString } from 'src/application/download-file-from-string';
import { formatBytes, parseBytes } from 'src/application/memory';
import { ControlledSelect } from 'src/components/controlled';
import { Dialog, DialogHeader, closeDialog, openDialog } from 'src/components/dialog';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { FormattedPrice } from 'src/intl/formatted';
import { Translate, TranslateEnum, createTranslate } from 'src/intl/translate';
import { InvoiceDiscount, InvoicePeriod } from 'src/model';
import { useTrial } from 'src/modules/trial/use-trial';
import { removeTimezoneOffset } from 'src/utils/date';

const T = createTranslate('pages.organizationSettings.billing.usage');

export function Usage() {
  const organization = useOrganization();
  const invoiceQuery = useNextInvoiceQuery();
  const trial = useTrial();

  return (
    <section className="col gap-6">
      <SectionHeader
        title={<T id="title" />}
        description={
          <T
            id={trial ? 'descriptionTrial' : 'description'}
            values={{
              strong: (children) => <strong className="text-default">{children}</strong>,
              days: trial?.daysLeft,
              plan: <TranslateEnum enum="plans" value={organization?.plan} />,
              upgrade: <T id="upgrade" />,
            }}
          />
        }
      />

      {invoiceQuery.isSuccess && <UsageDetails {...invoiceQuery.data} />}

      <DownloadUsageButton />
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
        <Fragment key={`${start}-${end}`}>
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
            <Price value={totalWithoutDiscount} />
          </UsageTotalRow>
        )}

        {discounts.map((discount) => (
          <UsageTotalRow key={discount.label} label={discount.label} className="text-green">
            <DiscountValue discount={discount} />
          </UsageTotalRow>
        ))}

        <UsageTotalRow label={<T id="total" />}>
          <Price value={total} />
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
  const isDatabase = label === 'Database storage';

  return (
    <div className="hidden items-center border-b px-3 py-2 sm:row">
      <div className="w-64">{label}</div>

      <div className="w-48 justify-end px-4 text-right">
        {isDatabase ? <UsageRowBytes data={usage} unit="MB" /> : <UsageRowTime time={usage} />}
      </div>

      <div className="px-4 text-dim">
        <UsageRowPrice
          price={isDatabase && price !== undefined ? price * 1000 : price}
          unit={isDatabase ? 'gbPerHour' : 'hour'}
        />
      </div>

      <div className="ml-auto justify-end">
        <UsageRowTotal total={total} />
      </div>
    </div>
  );
}

function UsageDetailsRowMobile({ label, usage, price, total }: UsageDetailsRowProps) {
  const isDatabase = label === 'Database storage';

  return (
    <div className="col gap-2 border-b p-4 sm:hidden">
      <div>{label}</div>

      <div className="row">
        {isDatabase ? <UsageRowBytes data={usage} unit="MB" /> : <UsageRowTime time={usage} />}

        <div className="ml-auto">
          <UsageRowTotal total={total} />
        </div>
      </div>

      <div className="text-dim">
        <UsageRowPrice
          price={isDatabase && price !== undefined ? price * 1000 : price}
          unit={isDatabase ? 'gbPerHour' : 'hour'}
        />
      </div>
    </div>
  );
}

type UsageRowBytesProps = {
  data?: number;
  unit: 'MB';
};

function UsageRowBytes({ data, unit }: UsageRowBytesProps) {
  if (!data) {
    return null;
  }

  return (
    <T
      id="usageData"
      values={{ data: formatBytes(parseBytes(`${data}${unit}`), { decimal: true, round: true }) }}
    />
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
  unit: 'hour' | 'gbPerHour';
};

function UsageRowPrice({ price, unit }: UsageRowPriceProps) {
  if (!price) {
    return null;
  }

  if (unit == 'gbPerHour') {
    return <T id="pricePerGbPerHour" values={{ price: <FormattedPrice value={price} digits={6} /> }} />;
  }

  return <T id="pricePerHour" values={{ price: <FormattedPrice value={price * 60 * 60} digits={6} /> }} />;
}

type UsageRowTotalProps = {
  total: number;
};

function UsageRowTotal({ total }: UsageRowTotalProps) {
  return <Price value={total} />;
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
    return <Price value={-discount.value} />;
  }

  if (discount.type === 'percentOff') {
    return (
      <span className="font-medium">
        <FormattedNumber style="percent" value={-discount.value} />
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

function DownloadUsageButton() {
  return (
    <>
      <Button color="gray" onClick={() => openDialog('DownloadUsage')} className="self-start">
        <T id="downloadUsage" />
      </Button>

      <Dialog id="DownloadUsage" className="col w-full max-w-lg gap-4">
        <DialogHeader title={<T id="downloadUsageDialog.title" />} />

        <div className="text-dim">
          <T id="downloadUsageDialog.description" />
        </div>

        <DownloadUsageForm />
      </Dialog>
    </>
  );
}

function DownloadUsageForm() {
  const form = useForm({
    defaultValues: {
      period: '',
    },
  });

  const mutation = useMutation({
    ...apiMutation('get /v1/usages/details', ({ period }: FormValues<typeof form>) => {
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
        <Button color="gray" variant="ghost" onClick={() => closeDialog()}>
          <Translate id="common.close" />
        </Button>
        <Button type="submit" loading={form.formState.isSubmitting}>
          <T id="downloadUsageDialog.submit" />
        </Button>
      </footer>
    </form>
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
