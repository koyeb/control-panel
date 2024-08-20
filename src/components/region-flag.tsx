import de from 'src/icons/flags/DE.png';
import fr from 'src/icons/flags/FR.png';
import jp from 'src/icons/flags/JP.png';
import sg from 'src/icons/flags/SG.png';
import us from 'src/icons/flags/US.png';

type RegionFlagProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  identifier: string;
};

export function RegionFlag({ identifier, ...props }: RegionFlagProps) {
  const flag = map[identifier];

  if (!flag) {
    return null;
  }

  return <img src={flag} {...props} />;
}

const map: Record<string, string> = {
  fra: de,
  par: fr,
  sfo: us,
  sin: sg,
  tyo: jp,
  was: us,
  'aws-us-east-1': us,
};
