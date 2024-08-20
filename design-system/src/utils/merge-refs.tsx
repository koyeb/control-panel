export function mergeRefs<T>(...refs: React.ForwardedRef<T>[]) {
  return (r: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(r);
      } else if (ref !== null) {
        ref.current = r;
      }
    });
  };
}
