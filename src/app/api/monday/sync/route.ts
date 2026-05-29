import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { createServiceClient } from "@/lib/supabase/server"
import { getBoardItems } from "@/lib/monday"

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createServiceClient()

  // Récupère la config du board
  const { data: config } = await supabase
    .schema("light")
    .from("monday_config")
    .select("board_id")
    .eq("id", "singleton")
    .single()

  if (!config?.board_id) {
    return NextResponse.json({ error: "Aucun board configuré" }, { status: 400 })
  }

  const items = await getBoardItems(config.board_id)

  let projectsCreated = 0
  let subTasksCreated = 0

  for (const item of items) {
    // Upsert project
    const { data: project } = await supabase
      .schema("light")
      .from("projects")
      .upsert({ name: item.name, monday_item_id: item.id }, { onConflict: "monday_item_id" })
      .select("id")
      .single()

    if (!project) continue
    projectsCreated++

    // Upsert sub-tasks
    for (const sub of item.subitems) {
      const { error } = await supabase
        .schema("light")
        .from("monday_sub_tasks")
        .upsert(
          { project_id: project.id, name: sub.name, monday_sub_item_id: sub.id },
          { onConflict: "monday_sub_item_id" }
        )
      if (!error) subTasksCreated++
    }
  }

  // Met à jour last_synced_at
  await supabase
    .schema("light")
    .from("monday_config")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", "singleton")

  return NextResponse.json({ projectsCreated, subTasksCreated })
}
