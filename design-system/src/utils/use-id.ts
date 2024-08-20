import React from 'react';

export function useId(id?: string) {
  const defaultId = React.useId();
  return id ?? defaultId;
}
