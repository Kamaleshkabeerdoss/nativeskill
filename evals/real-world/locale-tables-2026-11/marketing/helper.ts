// A local plural helper picks English words at run time; the checker cannot read which one.
const plural = (n: number, one: string, other: string) => (n === 1 ? one : other)

export const en = {
  uploaded: (n: number) => `${n} ${plural(n, 'file', 'files')} uploaded`,
  tags: ['Sales', 'Support'].join(', '),
}
