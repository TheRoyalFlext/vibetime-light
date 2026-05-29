import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { webhookUrl } = await req.json()

  const supabase = createServiceClient()
  const { data: config } = await supabase
    .schema("light")
    .from("monday_config")
    .select("board_id")
    .eq("id", "singleton")
    .single()

  if (!config?.board_id) {
    return NextResponse.json({ error: "Board non configuré" }, { status: 400 })
  }

  const events = ["create_item", "update_name", "create_subitem", "delete_item"]
  const results = []

  for (const event of events) {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_TOKEN!,
        "API-Version": "2024-01",
      },
      body: JSON.stringify({
        query: `
          mutation ($boardId: ID!, $url: String!, $event: WebhookEventType!) {
            create_webhook(board_id: $boardId, url: $url, event: $event) {
              id
              board_id
            }
          }
        `,
        variables: {
          boardId: config.board_id,
          url: webhookUrl,
          event,
        },
      }),
    })

    const json = await res.json()
    if (json.errors) {
      results.push({ event, error: json.errors[0].message })
    } else {
      results.push({ event, id: json.data?.create_webhook?.id })
    }
  }

  return NextResponse.json({ results })
}
