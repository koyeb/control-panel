type NoResourceProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  cta: React.ReactNode;
};

export function NoResource({ title, description, cta }: NoResourceProps) {
  return (
    <div className="col items-center gap-4 rounded-md border p-6 lg:py-16">
      <div className="col max-w-md gap-2 text-center">
        <p className="text-base font-medium">{title}</p>
        <p className="text-dim">{description}</p>
      </div>
      {cta}
    </div>
  );
}
