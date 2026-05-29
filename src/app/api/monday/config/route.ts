import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createServiceClient } from "@/lib/supabase/server"
import { getBoardColumns } from "@/lib/monday"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .schema("light")
    .from("monday_config")
    .select("*")
    .eq("id", "singleton")
    .single()

  return NextResponse.json(data ?? null)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { boardId, hoursColumnId } = await req.json()

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .schema("light")
    .from("monday_config")
    .upsert({ id: "singleton", board_id: boardId, hours_column_id: hoursColumnId ?? null, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET_COLUMNS(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get("boardId")
  if (!boardId) return NextResponse.json({ error: "boardId required" }, { status: 400 })

  const columns = await getBoardColumns(boardId)
  return NextResponse.json(columns.filter(c => c.type === "numbers" || c.type === "numeric"))
}
