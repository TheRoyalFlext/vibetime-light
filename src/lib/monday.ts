const MONDAY_API_URL = "https://api.monday.com/v2"

async function query<T>(gql: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.MONDAY_API_TOKEN!,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query: gql, variables }),
    cache: "no-store",
  })

  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

export type MondayItem = {
  id: string
  name: string
  subitems: { id: string; name: string } []
}

export type MondayColumn = {
  id: string
  title: string
  type: string
}

export async function getBoardItems(boardId: string): Promise<MondayItem[]> {
  const data = await query<{ boards: { items_page: { items: MondayItem[] } }[] }>(`
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 200) {
          items {
            id
            name
            subitems { id name }
          }
        }
      }
    }
  `, { boardId })

  return data.boards[0]?.items_page.items ?? []
}

export async function getBoardColumns(boardId: string): Promise<MondayColumn[]> {
  const data = await query<{ boards: { columns: MondayColumn[] }[] }>(`
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        columns { id title type }
      }
    }
  `, { boardId })

  return data.boards[0]?.columns ?? []
}

export async function createSubitem(parentItemId: string, designerName: string): Promise<string> {
  const data = await query<{ create_subitem: { id: string } }>(`
    mutation ($parentItemId: ID!, $name: String!) {
      create_subitem(parent_item_id: $parentItemId, item_name: $name) { id }
    }
  `, { parentItemId, name: designerName })

  return data.create_subitem.id
}

export async function updateSubitemNumberColumn(itemId: string, boardId: string, columnId: string, value: number): Promise<void> {
  await query(`
    mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id }
    }
  `, { boardId, itemId, columnId, value: JSON.stringify(value) })
}

export async function getSubitemColumnValue(itemId: string, columnId: string): Promise<number> {
  const data = await query<{ items: { column_values: { id: string; value: string }[] }[] }>(`
    query ($itemId: ID!, $columnId: String!) {
      items(ids: [$itemId]) {
        column_values(ids: [$columnId]) { id value }
      }
    }
  `, { itemId, columnId })

  const raw = data.items[0]?.column_values[0]?.value
  if (!raw) return 0
  try { return JSON.parse(raw) ?? 0 } catch { return 0 }
}
