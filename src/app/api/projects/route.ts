import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema("light")
    .from("projects")
    .select("*, monday_sub_tasks(id, name)")
    .order("name")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
