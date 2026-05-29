import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId") ?? session.user.id
  const weekStart = searchParams.get("weekStart")

  if (!weekStart) return NextResponse.json({ error: "weekStart required" }, { status: 400 })

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema("light")
    .from("time_entries")
    .select("*, projects(id, name, color), monday_sub_tasks(id, name)")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd.toISOString().split("T")[0])
    .order("date")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { userId, projectId, mondaySubTaskId, date, hours, note } = body

  const targetUserId = userId ?? session.user.id

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema("light")
    .from("time_entries")
    .insert({
      user_id: targetUserId,
      logged_by_id: session.user.id,
      project_id: projectId,
      monday_sub_task_id: mondaySubTaskId ?? null,
      date,
      hours,
      note: note ?? null,
    })
    .select("*, projects(id, name, color), monday_sub_tasks(id, name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
