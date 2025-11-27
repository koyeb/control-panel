import clsx from 'clsx';

type BoxSkeletonProps = React.HTMLAttributes<HTMLSpanElement>;

export function BoxSkeleton({ className, ...props }: BoxSkeletonProps) {
  return <span className={clsx('inline-block animate-pulse rounded-sm bg-muted', className)} {...props} />;
}

type CircleSkeletonProps = {
  className?: string;
};

export function CircleSkeleton({ className }: CircleSkeletonProps) {
  return <BoxSkeleton className={clsx('rounded-full', className)} />;
}

type TextSkeletonProps = {
  width: number | 'full';
  className?: string;
};

export function TextSkeleton({ width, className }: TextSkeletonProps) {
  return (
    <BoxSkeleton
      className={clsx({ 'w-full': width === 'full' }, className)}
      style={typeof width === 'number' ? { width: `${width}rem` } : undefined}
    >
      <wbr />
    </BoxSkeleton>
  );
}
