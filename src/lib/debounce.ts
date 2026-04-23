export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
) {
  let t: ReturnType<typeof setTimeout> | null = null;
  const wrapped = (...args: Args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => {
    if (t) clearTimeout(t);
    t = null;
  };
  return wrapped;
}
