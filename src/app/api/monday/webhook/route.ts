import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// Monday envoie un challenge à la création du webhook — il faut le renvoyer
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Handshake Monday
  if (body.challenge) {
    return NextResponse.json({ challenge: body.challenge })
  }

  const event = body.event
  if (!event) return new NextResponse(null, { status: 200 })

  const supabase = createServiceClient()

  // Nouvel item créé sur le board → nouveau projet
  if (event.type === "create_item") {
    await supabase
      .schema("light")
      .from("projects")
      .upsert({ name: event.itemName, monday_item_id: String(event.itemId) }, { onConflict: "monday_item_id" })
  }

  // Item renommé → mise à jour du projet
  if (event.type === "update_name" && event.itemId && !event.parentItemId) {
    await supabase
      .schema("light")
      .from("projects")
      .update({ name: event.value?.name ?? event.previousValue?.name })
      .eq("monday_item_id", String(event.itemId))
  }

  // Sous-item créé → nouvelle sous-tâche
  if (event.type === "create_subitem") {
    const { data: project } = await supabase
      .schema("light")
      .from("projects")
      .select("id")
      .eq("monday_item_id", String(event.parentItemId))
      .single()

    if (project) {
      await supabase
        .schema("light")
        .from("monday_sub_tasks")
        .upsert(
          { project_id: project.id, name: event.itemName, monday_sub_item_id: String(event.itemId) },
          { onConflict: "monday_sub_item_id" }
        )
    }
  }

  // Item supprimé → supprime le projet (cascade sur sub_tasks et time_entries)
  if (event.type === "delete_item" && !event.parentItemId) {
    await supabase
      .schema("light")
      .from("projects")
      .delete()
      .eq("monday_item_id", String(event.itemId))
  }

  return new NextResponse(null, { status: 200 })
}
