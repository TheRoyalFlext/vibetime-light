export type Role = "ADMIN" | "MANAGER" | "USER"

export type WorkScheduleSlot = { start: string; end: string }
export type WorkScheduleDay = { enabled: boolean; slots: WorkScheduleSlot[] }
export type WorkSchedule = {
  monday: WorkScheduleDay
  tuesday: WorkScheduleDay
  wednesday: WorkScheduleDay
  thursday: WorkScheduleDay
  friday: WorkScheduleDay
}

export type User = {
  id: string
  email: string
  name: string | null
  image: string | null
  role: Role
  managerId: string | null
  workSchedule: WorkSchedule | null
  mondayUserId: string | null
  createdAt: string
}

export type Project = {
  id: string
  name: string
  deadline: string | null
  color: string | null
  mondayItemId: string | null
  createdAt: string
}

export type MondaySubTask = {
  id: string
  projectId: string
  name: string
  mondaySubItemId: string | null
}

export type ProjectAllocation = {
  id: string
  userId: string
  projectId: string
  plannedHours: number
  weekStart: string
  createdById: string
  createdAt: string
}

export type TimeEntry = {
  id: string
  userId: string
  loggedById: string
  projectId: string
  mondaySubTaskId: string | null
  date: string
  hours: number
  note: string | null
  mondaySyncedAt: string | null
  createdAt: string
}

export type Conflict = {
  userId: string
  weekStart: string
  capacityHours: number
  allocatedHours: number
  delta: number
}
