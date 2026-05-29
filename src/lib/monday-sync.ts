import { createServiceClient } from "@/lib/supabase/server"
import { createSubitem, updateSubitemNumberColumn, getSubitemColumnValue } from "@/lib/monday"

type SyncParams = {
  timeEntryId: string
  userId: string
  mondaySubTaskId: string
  hours: number
}

export async function syncTimeEntryToMonday({ timeEntryId, userId, mondaySubTaskId, hours }: SyncParams) {
  const supabase = createServiceClient()

  // Récupère la config
  const { data: config } = await supabase
    .schema("light")
    .from("monday_config")
    .select("board_id, hours_column_id")
    .eq("id", "singleton")
    .single()

  if (!config?.board_id || !config?.hours_column_id) return

  // Récupère le sub-task pour avoir le monday_sub_item_id
  const { data: subTask } = await supabase
    .schema("light")
    .from("monday_sub_tasks")
    .select("monday_sub_item_id, project_id")
    .eq("id", mondaySubTaskId)
    .single()

  if (!subTask?.monday_sub_item_id) return

  // Récupère le nom du designer
  const { data: user } = await supabase
    .schema("light")
    .from("users")
    .select("name")
    .eq("id", userId)
    .single()

  const designerName = user?.name ?? "Designer"

  // Cherche si un sub-item existe déjà pour ce designer sur cette tâche
  // Convention : sub-item nommé "{designerName}" sous le sub-task
  // On stocke l'ID dans une table dédiée ou on le retrouve via Monday
  // Pour simplifier : on cherche un sub-item existant dans monday_sub_tasks avec ce pattern
  const { data: designerSubItem } = await supabase
    .schema("light")
    .from("monday_sub_tasks")
    .select("monday_sub_item_id")
    .eq("project_id", subTask.project_id)
    .eq("name", `${designerName} — ${subTask.project_id}`)
    .single()

  let mondaySubItemId = designerSubItem?.monday_sub_item_id

  // Si pas encore de sub-item pour ce designer, on en crée un
  if (!mondaySubItemId) {
    const { data: parentTask } = await supabase
      .schema("light")
      .from("monday_sub_tasks")
      .select("monday_sub_item_id")
      .eq("id", mondaySubTaskId)
      .single()

    if (!parentTask?.monday_sub_item_id) return

    mondaySubItemId = await createSubitem(parentTask.monday_sub_item_id, designerName)

    // Sauvegarde ce nouveau sub-item
    await supabase
      .schema("light")
      .from("monday_sub_tasks")
      .insert({
        project_id: subTask.project_id,
        name: `${designerName} — ${subTask.project_id}`,
        monday_sub_item_id: mondaySubItemId,
      })
  }

  // Calcule le total des heures loggées par ce designer sur cette sous-tâche
  const { data: allEntries } = await supabase
    .schema("light")
    .from("time_entries")
    .select("hours")
    .eq("user_id", userId)
    .eq("monday_sub_task_id", mondaySubTaskId)

  const totalHours = (allEntries ?? []).reduce((s, e) => s + e.hours, 0)

  // Met à jour la colonne heures dans Monday
  await updateSubitemNumberColumn(mondaySubItemId, config.board_id, config.hours_column_id, totalHours)

  // Marque l'entrée comme synchronisée
  await supabase
    .schema("light")
    .from("time_entries")
    .update({ monday_synced_at: new Date().toISOString() })
    .eq("id", timeEntryId)
}
