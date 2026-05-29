import type { WorkSchedule, Conflict } from "@/types"

const DAY_KEYS: (keyof WorkSchedule)[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday",
]

function hoursFromSlots(slots: { start: string; end: string }[]): number {
  return slots.reduce((total, slot) => {
    const [sh, sm] = slot.start.split(":").map(Number)
    const [eh, em] = slot.end.split(":").map(Number)
    return total + (eh + em / 60) - (sh + sm / 60)
  }, 0)
}

export function weekCapacityHours(schedule: WorkSchedule): number {
  return DAY_KEYS.reduce((total, day) => {
    const d = schedule[day]
    if (!d.enabled) return total
    return total + hoursFromSlots(d.slots)
  }, 0)
}

export function detectConflicts(
  allocations: { userId: string; weekStart: string; plannedHours: number }[],
  users: { id: string; workSchedule: WorkSchedule | null }[]
): Conflict[] {
  const scheduleMap = new Map(users.map((u) => [u.id, u.workSchedule]))

  const grouped = new Map<string, number>()
  for (const a of allocations) {
    const key = `${a.userId}__${a.weekStart}`
    grouped.set(key, (grouped.get(key) ?? 0) + a.plannedHours)
  }

  const conflicts: Conflict[] = []
  for (const [key, allocatedHours] of grouped) {
    const [userId, weekStart] = key.split("__")
    const schedule = scheduleMap.get(userId)
    if (!schedule) continue
    const capacityHours = weekCapacityHours(schedule)
    if (allocatedHours > capacityHours) {
      conflicts.push({ userId, weekStart, capacityHours, allocatedHours, delta: allocatedHours - capacityHours })
    }
  }

  return conflicts
}
