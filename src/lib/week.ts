export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 4)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${weekStart.toLocaleDateString("fr-FR", opts)} – ${end.toLocaleDateString("fr-FR", { ...opts, year: "numeric" })}`
}

export function formatDay(date: Date): { short: string; num: string } {
  return {
    short: date.toLocaleDateString("fr-FR", { weekday: "short" }),
    num: date.toLocaleDateString("fr-FR", { day: "numeric" }),
  }
}
