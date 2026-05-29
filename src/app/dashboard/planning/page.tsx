import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { getWeekStart, toDateString } from "@/lib/week"
import { WeekNavigator } from "../hours/_components/WeekNavigator"
import { PlanningBoard } from "./_components/PlanningBoard"
import type { WorkSchedule } from "@/types"

type Props = {
  searchParams: Promise<{ week?: string }>
}

export default async function PlanningPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  const { week } = await searchParams
  const weekStart = getWeekStart(week ? new Date(week + "T12:00:00") : new Date())
  const weekStartStr = toDateString(weekStart)

  const supabase = createServiceClient()

  const [{ data: users }, { data: allocations }] = await Promise.all([
    supabase
      .schema("light")
      .from("users")
      .select("id, name, image, work_schedule")
      .order("name"),
    supabase
      .schema("light")
      .from("project_allocations")
      .select("id, planned_hours, project_id, user_id, projects(id, name, color)")
      .eq("week_start", weekStartStr),
  ])

  const designers = (users ?? []).map(u => ({
    id: u.id,
    name: u.name,
    image: u.image,
    work_schedule: u.work_schedule as WorkSchedule | null,
    allocations: (allocations ?? [])
      .filter(a => a.user_id === u.id)
      .map(a => ({
        id: a.id,
        planned_hours: a.planned_hours,
        project_id: a.project_id,
        projects: (Array.isArray(a.projects) ? a.projects[0] : a.projects) as { id: string; name: string; color: string | null },
      })),
  }))

  const totalAllocated = designers.reduce((s, d) => s + d.allocations.reduce((ss, a) => ss + a.planned_hours, 0), 0)
  const conflicts = designers.filter(d => {
    const capacity = d.work_schedule
      ? d.allocations.reduce((s, _) => s, 0) // computed in board
      : 0
    return capacity > 0
  }).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Planning</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalAllocated}h allouées · {designers.length} designers
          </p>
        </div>
        <WeekNavigator weekStart={weekStart} />
      </div>

      <PlanningBoard designers={designers} weekStart={weekStart} />
    </div>
  )
}
