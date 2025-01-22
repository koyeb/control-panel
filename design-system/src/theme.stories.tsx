import { Meta, StoryFn } from '@storybook/react';
import clsx from 'clsx';
import { useState } from 'react';
import { parseColor } from 'tailwindcss/lib/util/color';

export default {
  title: 'DesignSystem/Theme',
} satisfies Meta;

const getHexColor = (value: string) => {
  const { color, alpha } = parseColor(value);

  const rgb = color
    .map(Number)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

  return `#${rgb}${alpha !== undefined ? (255 * alpha)?.toString(16).padStart(2, '0') : ''}`;
};

const Box = function Box(props: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={clsx(props.className, 'flex size-12 items-center justify-center rounded')} />
  );
};

type DesignTokenProps = {
  name: string;
  description: string;
  children: React.ReactNode;
};

function DesignToken({ name, description, children }: DesignTokenProps) {
  return (
    <div className="row max-w-4xl gap-4 py-4">
      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="w-[480px]">
        <code className="rounded bg-muted px-2 py-1">{name}</code>
        <p className="mt-2 text-dim">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function onRef(setHex: (hex: string) => void, property: 'color' | 'backgroundColor' | 'borderColor') {
  return (element: HTMLDivElement | null) => {
    if (element) {
      setHex(getHexColor(window.getComputedStyle(element)[property]));
    }
  };
}

function BackgroundColor({ className }: { className: string }) {
  const [hex, setHex] = useState('');

  return (
    <div className="row gap-4">
      <Box ref={onRef(setHex, 'backgroundColor')} className={className} />
      <div className="col gap-1 text-xs">
        <code>{hex}</code>
        <code>{className}</code>
      </div>
    </div>
  );
}

function TextColor({ className, extraClassName }: { className: string; extraClassName?: string }) {
  const [hex, setHex] = useState('');

  return (
    <div className="row gap-4">
      <Box ref={onRef(setHex, 'color')} className={clsx(className, extraClassName)}>
        Koyeb
      </Box>
      <div className="col gap-1 text-xs">
        <code>{hex}</code>
        <code>{className}</code>
      </div>
    </div>
  );
}

function BorderColor({ className }: { className: string }) {
  const [hex, setHex] = useState('');

  return (
    <div className="row gap-4">
      <Box ref={onRef(setHex, 'borderColor')} className={clsx('border', className)} />
      <div className="col gap-1 text-xs">
        <code>{hex}</code>
        <code>{className}</code>
      </div>
    </div>
  );
}

export const designTokens: StoryFn = () => {
  return (
    <div className="col gap-8">
      <div className="col divide-y">
        <h2 className="text-xl">Background colors</h2>

        <DesignToken name="color.background.neutral" description="Page background">
          <BackgroundColor className="bg-neutral" />
        </DesignToken>

        <DesignToken name="color.background.inverted" description="Dark mode page background">
          <BackgroundColor className="bg-inverted" />
        </DesignToken>

        <DesignToken name="color.background.red" description="Description">
          <BackgroundColor className="bg-red" />
        </DesignToken>

        <DesignToken name="color.background.green" description="Description">
          <BackgroundColor className="bg-green" />
        </DesignToken>

        <DesignToken name="color.background.blue" description="Description">
          <BackgroundColor className="bg-blue" />
        </DesignToken>

        <DesignToken name="color.background.orange" description="Description">
          <BackgroundColor className="bg-orange" />
        </DesignToken>

        <DesignToken name="color.background.gray" description="Description">
          <BackgroundColor className="bg-gray" />
        </DesignToken>

        <DesignToken name="color.background.muted" description="Description">
          <BackgroundColor className="bg-muted" />
        </DesignToken>

        <DesignToken name="color.background.popover" description="Description">
          <BackgroundColor className="bg-popover" />
        </DesignToken>
      </div>

      <div className="col divide-y">
        <h2 className="text-xl">Contrast text colors</h2>

        <DesignToken name="color.text.contrast.red" description="Description">
          <TextColor className="text-contrast-red" extraClassName="bg-red" />
        </DesignToken>

        <DesignToken name="color.text.contrast.green" description="Description">
          <TextColor className="text-contrast-green" extraClassName="bg-green" />
        </DesignToken>

        <DesignToken name="color.text.contrast.blue" description="Description">
          <TextColor className="text-contrast-blue" extraClassName="bg-blue" />
        </DesignToken>

        <DesignToken name="color.text.contrast.orange" description="Description">
          <TextColor className="text-contrast-orange" extraClassName="bg-orange" />
        </DesignToken>

        <DesignToken name="color.text.contrast.gray" description="Description">
          <TextColor className="text-contrast-gray" extraClassName="bg-gray" />
        </DesignToken>

        <DesignToken name="color.text.contrast.popover" description="Description">
          <TextColor className="text-contrast-popover" extraClassName="bg-popover" />
        </DesignToken>
      </div>

      <div className="col divide-y">
        <h2 className="text-xl">Text colors</h2>

        <DesignToken name="color.text.default" description="Description">
          <TextColor className="text-default" />
        </DesignToken>

        <DesignToken name="color.text.inverted" description="Description">
          <TextColor className="text-inverted" />
        </DesignToken>

        <DesignToken name="color.text.dim" description="Description">
          <TextColor className="text-dim" />
        </DesignToken>

        <DesignToken name="color.text.placeholder" description="Description">
          <TextColor className="text-placeholder" />
        </DesignToken>

        <DesignToken name="color.text.red" description="Description">
          <TextColor className="text-red" />
        </DesignToken>

        <DesignToken name="color.text.green" description="Description">
          <TextColor className="text-green" />
        </DesignToken>

        <DesignToken name="color.text.blue" description="Description">
          <TextColor className="text-blue" />
        </DesignToken>

        <DesignToken name="color.text.orange" description="Description">
          <TextColor className="text-orange" />
        </DesignToken>

        <DesignToken name="color.text.gray" description="Description">
          <TextColor className="text-gray" />
        </DesignToken>
      </div>

      <div className="col divide-y">
        <h2 className="text-xl">Border colors</h2>

        <DesignToken name="color.border.default" description="Description">
          <BorderColor className="border-default" />
        </DesignToken>

        <DesignToken name="color.border.strong" description="Description">
          <BorderColor className="border-strong" />
        </DesignToken>

        <DesignToken name="color.border.red" description="Description">
          <BorderColor className="border-red" />
        </DesignToken>

        <DesignToken name="color.border.green" description="Description">
          <BorderColor className="border-green" />
        </DesignToken>

        <DesignToken name="color.border.blue" description="Description">
          <BorderColor className="border-blue" />
        </DesignToken>

        <DesignToken name="color.border.orange" description="Description">
          <BorderColor className="border-orange" />
        </DesignToken>

        <DesignToken name="color.border.gray" description="Description">
          <BorderColor className="border-gray" />
        </DesignToken>
      </div>
    </div>
  );
};

function Spacing({ label, rem, className }: { label: string; rem: number; className: string }) {
  return (
    <div className="row gap-4">
      <div className="row w-32 justify-between">
        <span className="text-xs text-dim">
          {rem} rem, {16 * rem} px
        </span>
        {label}
      </div>
      <div className={clsx('h-4 bg-green', className)} />
    </div>
  );
}

export const spacings: StoryFn = () => {
  return (
    <div className="col gap-2">
      <Spacing label="0" rem={0} className="w-0" />
      <Spacing label="px" rem={1 / 16} className="w-px" />
      <Spacing label="0.5" rem={0.125} className="w-0.5" />
      <Spacing label="1" rem={0.25} className="w-1" />
      <Spacing label="1.5" rem={0.375} className="w-1.5" />
      <Spacing label="2" rem={0.5} className="w-2" />
      <Spacing label="2.5" rem={0.625} className="w-2.5" />
      <Spacing label="3" rem={0.75} className="w-3" />
      <Spacing label="3.5" rem={0.875} className="w-3.5" />
      <Spacing label="4" rem={1} className="w-4" />
      <Spacing label="5" rem={1.25} className="w-5" />
      <Spacing label="6" rem={1.5} className="w-6" />
      <Spacing label="7" rem={1.75} className="w-7" />
      <Spacing label="8" rem={2} className="w-8" />
      <Spacing label="9" rem={2.25} className="w-9" />
      <Spacing label="10" rem={2.5} className="w-10" />
      <Spacing label="11" rem={2.75} className="w-11" />
      <Spacing label="12" rem={3} className="w-12" />
      <Spacing label="14" rem={3.5} className="w-14" />
      <Spacing label="16" rem={4} className="w-16" />
      <Spacing label="20" rem={5} className="w-20" />
      <Spacing label="24" rem={6} className="w-24" />
      <Spacing label="28" rem={7} className="w-28" />
      <Spacing label="32" rem={8} className="w-32" />
      <Spacing label="36" rem={9} className="w-36" />
      <Spacing label="40" rem={10} className="w-40" />
      <Spacing label="44" rem={11} className="w-44" />
      <Spacing label="48" rem={12} className="w-48" />
      <Spacing label="52" rem={13} className="w-52" />
      <Spacing label="56" rem={14} className="w-56" />
      <Spacing label="60" rem={15} className="w-60" />
      <Spacing label="64" rem={16} className="w-64" />
      <Spacing label="72" rem={18} className="w-72" />
      <Spacing label="80" rem={20} className="w-80" />
      <Spacing label="96" rem={24} className="w-96" />
    </div>
  );
};

function BorderRadius({ label, className }: { label: string; className: string }) {
  return (
    <div className="row items-center gap-4">
      <div className="w-16">{label}</div>
      <div className={clsx('size-16 border', className)} />
    </div>
  );
}

export const borderRadii: StoryFn = () => {
  return (
    <div className="col gap-8">
      <BorderRadius label="none" className="rounded-none" />
      <BorderRadius label="sm" className="rounded-sm" />
      <BorderRadius label="default" className="rounded" />
      <BorderRadius label="md" className="rounded-md" />
      <BorderRadius label="lg" className="rounded-lg" />
      <BorderRadius label="xl" className="rounded-xl" />
      <BorderRadius label="2xl" className="rounded-2xl" />
      <BorderRadius label="full" className="rounded-full" />
    </div>
  );
};

function Shadow({ label, className }: { label: string; className: string }) {
  return (
    <div className="row items-center gap-4">
      <div className="w-16">{label}</div>
      <div className={clsx('size-16 rounded', className)} />
    </div>
  );
}

export const shadows: StoryFn = () => {
  return (
    <div className="col gap-8">
      <Shadow label="none" className="shadow-none" />
      <Shadow label="sm" className="shadow-sm" />
      <Shadow label="default" className="shadow" />
      <Shadow label="md" className="shadow-md" />
      <Shadow label="lg" className="shadow-lg" />
      <Shadow label="xl" className="shadow-xl" />
      <Shadow label="2xl" className="shadow-2xl" />
      <Shadow label="inner" className="shadow-inner" />
    </div>
  );
};

export const fonts: StoryFn = () => {
  return (
    <div className="col gap-4">
      <Font label="sans (inter)" className="font-sans" />
    </div>
  );
};

function Font({ label, className }: { label: string; className: string }) {
  return (
    <div className="row items-center gap-4">
      <div className="w-20">{label}</div>
      <div className={clsx('text-base', className)}>
        <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
        <div>abcdefghijklmnopqrstuvwxyz</div>
        <div>0123456789</div>
      </div>
    </div>
  );
}
