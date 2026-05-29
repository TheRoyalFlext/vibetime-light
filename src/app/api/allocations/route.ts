import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get("weekStart")
  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema("light")
    .from("project_allocations")
    .select("*, projects(id, name, color), users!project_allocations_user_id_fkey(id, name, image, work_schedule)")
    .eq("week_start", weekStart)
    .order("created_at")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { userId, projectId, plannedHours, weekStart } = body

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema("light")
    .from("project_allocations")
    .upsert({
      user_id: userId,
      project_id: projectId,
      planned_hours: plannedHours,
      week_start: weekStart,
      created_by_id: session.user.id,
    }, { onConflict: "user_id,project_id,week_start" })
    .select("*, projects(id, name, color)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
