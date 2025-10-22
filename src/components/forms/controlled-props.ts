import React from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

import { Extend } from 'src/utils/types';

export type ControlledProps<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component extends React.JSXElementConstructor<any>,
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
> = Extend<
  React.ComponentProps<Component>,
  {
    control?: Control<Form>;
    name: Name;
    onChangeEffect?: (event: React.ChangeEvent<React.ComponentRef<Component>>) => void;
  }
>;
