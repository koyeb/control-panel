import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ComponentPlaceholder } from '../utils/storybook';

import { AccordionSection } from './accordion';

type Args = {
  hasError?: boolean;
};

const meta = {
  title: 'DesignSystem/Accordion',
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: {
    hasError: false,
  },
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: ({ hasError }) => {
    const [expanded, setExpanded] = useState<number>();

    return (
      <>
        {[1, 2, 3].map((item) => (
          <AccordionSection
            key={item}
            header={
              <header className="p-4" onClick={() => setExpanded(expanded === item ? undefined : item)}>
                item {item} header
              </header>
            }
            isExpanded={expanded === item}
            hasError={hasError && item === 2}
          >
            <ComponentPlaceholder />
          </AccordionSection>
        ))}
      </>
    );
  },
};
