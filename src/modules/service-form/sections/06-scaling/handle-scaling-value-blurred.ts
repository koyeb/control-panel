export function handleScalingValueBlurred(
  event: React.FocusEvent<HTMLInputElement>,
  setValue: (value: number) => void,
) {
  const target = event.target;
  const [min, max] = [Number(target.min), Number(target.max)];

  if (target.value === '') setValue(min);
  if (target.valueAsNumber < min) setValue(min);
  if (target.valueAsNumber > max) setValue(max);
}
