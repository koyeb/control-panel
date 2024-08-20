export function restrictKeys(predicate: (key: string) => boolean): React.KeyboardEventHandler {
  return (event) => {
    if (!predicate(event.key)) {
      event.preventDefault();
    }
  };
}

export const onKeyDownPositiveInteger = restrictKeys((key) => {
  return key !== '.' && key !== 'e' && key !== '-' && key !== '+';
});
