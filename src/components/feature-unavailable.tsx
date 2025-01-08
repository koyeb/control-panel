import { BadgeNew } from 'src/components/badge-new';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('components.featureUnavailable');

type FeatureUnavailableProps = {
  preview?: 'technical' | 'public';
  title: React.ReactNode;
  subTitle: React.ReactNode;
  description: React.ReactNode;
  cta: React.ReactNode;
  documentationLink?: React.ReactNode;
};

export function FeatureUnavailable({
  preview,
  title,
  subTitle,
  description,
  cta,
  documentationLink,
}: FeatureUnavailableProps) {
  return (
    <>
      {preview !== undefined && (
        <BadgeNew className="mb-2">
          <T id={`${preview}Preview`} />
        </BadgeNew>
      )}

      <Title title={title} />

      <p className="mb-4 mt-2 font-medium">{subTitle}</p>

      <p className="max-w-xl">{description}</p>

      <div className="row mt-6 items-center gap-4">
        {cta}
        {documentationLink}
      </div>
    </>
  );
}
