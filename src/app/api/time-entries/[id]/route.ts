import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { hours, note, mondaySubTaskId } = body

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema("light")
    .from("time_entries")
    .update({ hours, note, monday_sub_task_id: mondaySubTaskId })
    .eq("id", id)
    .select("*, projects(id, name, color), monday_sub_tasks(id, name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase.schema("light").from("time_entries").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
