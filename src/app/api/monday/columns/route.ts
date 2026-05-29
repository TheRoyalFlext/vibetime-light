import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getBoardColumns } from "@/lib/monday"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get("boardId")
  if (!boardId) return NextResponse.json({ error: "boardId required" }, { status: 400 })

  const columns = await getBoardColumns(boardId)
  return NextResponse.json(columns.filter(c => c.type === "numbers" || c.type === "numeric"))
}
