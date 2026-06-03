export const formatPercent = (v = 0) => `${Number(v).toFixed(2)}%`

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

export const formatK = (num: number) =>
  num >= 1000 ? `${(num / 1000).toFixed(2)}k` : num.toString()
