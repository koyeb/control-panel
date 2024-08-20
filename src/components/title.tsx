type TitleProps = {
  title: React.ReactNode;
  end?: React.ReactNode;
};

export function Title({ title, end }: TitleProps) {
  return (
    <div className="row flex-wrap gap-4">
      <h1 className="typo-heading">{title}</h1>
      {end && <div className="ml-auto">{end}</div>}
    </div>
  );
}
