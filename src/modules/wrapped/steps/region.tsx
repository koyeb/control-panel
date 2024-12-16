import { motion } from 'motion/react';
import React, { useState } from 'react';

import { useRegions } from 'src/api/hooks/catalog';
import { RegionFlag } from 'src/components/region-flag';
import { hasProperty } from 'src/utils/object';

import { Fade } from '../components/fade';
import { Footer } from '../components/footer';
import imgPassport from '../images/passport.png';
import { WrappedData } from '../wrapped-data';

export function Region({ data, next }: { data: WrappedData; next: () => void }) {
  const regions = useRegions();
  const [region, ...otherRegions] = data.regions.map((region) =>
    regions.find(hasProperty('identifier', region)),
  );

  const [step, setStep] = useState(0);

  return (
    <React.Fragment>
      <div>
        <p className="text-center text-2xl font-medium">Your favorite region is...</p>

        <motion.p
          initial={{ opacity: 0, transform: 'scale(0%)' }}
          animate={{ opacity: 1, transform: 'scale(100%)' }}
          transition={{ delay: 1, ease: 'easeOut', bounce: 0, duration: 1 }}
          onAnimationComplete={() => setStep(1)}
          className="row my-16 items-center justify-center gap-6 overflow-x-clip text-center text-4xl"
        >
          <RegionFlag identifier={region?.identifier} />
          {region?.displayName}
          <RegionFlag identifier={region?.identifier} />
        </motion.p>
      </div>

      {otherRegions.length === 0 && (
        <Fade show={step >= 1} after={() => setStep(2)} delay={0.5}>
          {<p className="mx-8 text-center text-lg font-medium">{regionSentences[region!.identifier]}</p>}
          <img src={imgPassport} className="my-16 h-32 " />
        </Fade>
      )}

      {otherRegions.length > 0 && (
        <Fade show={step >= 1} after={() => setStep(2)} delay={0.5}>
          <p className="text-center text-xl font-medium">
            But you deployed all around the world, also in{' '}
            {otherRegions.map((region) => region!.displayName).join(', ')}
          </p>

          <img src={imgPassport} className="mx-auto my-16 h-32 " />

          <p className="text-4xl">Truly global!!</p>
        </Fade>
      )}

      <Footer next={next} />
    </React.Fragment>
  );
}

const regionSentences: Record<string, string> = {
  fra: "Let's celebrate with beers and pretzels! 🥨🍺",
  par: "Let's have a croque monsieur tonight! 🥪",
  sin: 'Time to celebrate with some chili crab by Marina Bay! 🦀',
  was: "Let's celebrate with a stroll through Georgetown and enjoy the holiday lights! ️❄️",
  sfo: "Let's go celebrate with a latte and watch the fog roll in! 🌁",
  tyo: "Let's celebrate this with some sushi and sake! 🍣",
};
