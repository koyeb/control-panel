import { motion } from 'motion/react';
import { useState } from 'react';

import { useRegions } from 'src/api/hooks/catalog';
import { RegionFlag } from 'src/components/region-flag';
import { hasProperty } from 'src/utils/object';

import imgPassport from '../images/passport.png';
import { WrappedData } from '../wrapped-data';

export function Region({ data, next }: { data: WrappedData; next: () => void }) {
  const regions = useRegions();
  const [region, ...otherRegions] = data.regions.map((region) =>
    regions.find(hasProperty('identifier', region)),
  );

  const [step, setStep] = useState(0);

  return (
    <div onClick={next} className="col h-full justify-between gap-4 text-center text-3xl font-semibold">
      <p className="mx-8">Your favorite region is...</p>

      <motion.p
        initial={{ opacity: 0, transform: 'scale(0%)' }}
        animate={{ opacity: 1, transform: 'scale(100%)' }}
        transition={{ delay: 0.5, ease: 'easeOut', bounce: 0, duration: 1 }}
        onAnimationComplete={() => setStep(1)}
        className="row items-center justify-center gap-6 font-bold"
      >
        <RegionFlag identifier={region?.identifier} />
        {region?.displayName}
        <RegionFlag identifier={region?.identifier} />
      </motion.p>

      {otherRegions.length === 0 && (
        <>
          <motion.p {...fade({ show: step >= 1, delay: 0.5, after: () => setStep(2) })}>
            {regionSentences[region!.identifier]}
          </motion.p>
          <motion.img {...fade({ show: step >= 1, delay: 0.5 })} src={imgPassport} className="mx-auto h-32" />
        </>
      )}

      {otherRegions.length > 0 && (
        <>
          <motion.p {...fade({ show: step >= 1, delay: 0.5 })}>
            But you deployed all around the world, also in{' '}
            {otherRegions.map((region) => region!.displayName).join(', ')}
          </motion.p>

          <motion.img {...fade({ show: step >= 1, delay: 0.5 })} src={imgPassport} className="mx-auto h-32" />

          <motion.p {...fade({ show: step >= 1, delay: 0.5 })} className="text-start">
            Truly global!!
          </motion.p>
        </>
      )}
    </div>
  );
}

const fade = ({ show, delay, after }: { show: boolean; delay?: number; after?: () => void }) => ({
  initial: { opacity: 0 },
  animate: { opacity: show ? 1 : 0 },
  onAnimationComplete: () => show && after?.(),
  transition: { delay },
});

const regionSentences: Record<string, string> = {
  fra: "Let's celebrate with beers and pretzels! 🥨🍺",
  par: "Let's have a croque monsieur tonight! 🥪",
  sin: 'Time to celebrate with some chili crab by Marina Bay! 🦀',
  was: "Let's celebrate with a stroll through Georgetown and enjoy the holiday lights! ️❄️",
  sfo: "Let's go celebrate with a latte and watch the fog roll in! 🌁",
  tyo: "Let's celebrate this with some sushi and sake! 🍣",
};
