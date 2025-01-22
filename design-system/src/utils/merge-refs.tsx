export function mergeRefs<T>(...refs: Array<React.ForwardedRef<T> | undefined>) {
  return (r: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(r);
      } else if (ref != null) {
        ref.current = r;
      }
    });
  };
}
