type Event = {
  preventDefault: () => void;
  stopPropagation: () => void;
};

export function preventDefault(event: Event) {
  event.preventDefault();
}

export function withPreventDefault<E extends Event, R>(cb: (event: E) => R): typeof cb {
  return (event: E) => {
    preventDefault(event);
    return cb(event);
  };
}

export function stopPropagation(event: Event) {
  event.stopPropagation();
}

export function withStopPropagation<E extends Event, R>(cb: (event: E) => R): typeof cb {
  return (event) => {
    stopPropagation(event);
    return cb(event);
  };
}
