import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { getWeekStart, getWeekDays, toDateString } from "@/lib/week"
import { WeekGrid } from "./_components/WeekGrid"
import { WeekNavigator } from "./_components/WeekNavigator"

type Props = {
  searchParams: Promise<{ week?: string }>
}

export default async function HoursPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  const { week } = await searchParams
  const weekStart = week ? new Date(week + "T12:00:00") : getWeekStart(new Date())
  const days = getWeekDays(getWeekStart(weekStart))
  const weekStartStr = toDateString(days[0])
  const weekEndStr = toDateString(days[4])

  const supabase = createServiceClient()

  const [{ data: entries }, { data: user }] = await Promise.all([
    supabase
      .schema("light")
      .from("time_entries")
      .select("*, projects(id, name, color), monday_sub_tasks(id, name)")
      .eq("user_id", session.user.id)
      .gte("date", weekStartStr)
      .lte("date", weekEndStr)
      .order("date"),
    supabase
      .schema("light")
      .from("users")
      .select("work_schedule")
      .eq("id", session.user.id)
      .single(),
  ])

  const totalWeek = (entries ?? []).reduce((s: number, e: { hours: number }) => s + e.hours, 0)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Mes heures</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Total semaine : <span className="font-medium text-gray-700">{totalWeek}h</span>
          </p>
        </div>
        <WeekNavigator weekStart={days[0]} />
      </div>

      <WeekGrid
        days={days}
        initialEntries={(entries ?? []) as Parameters<typeof WeekGrid>[0]["initialEntries"]}
        workSchedule={user?.work_schedule ?? null}
      />
    </div>
  )
}
