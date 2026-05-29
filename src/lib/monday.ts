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
  })

  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

export async function getBoardItems(boardId: string) {
  const data = await query<{ boards: { items_page: { items: MondayItem[] } }[] }>(`
    query ($boardId: ID!) {
      boards(ids: [$boardId]) {
        items_page(limit: 200) {
          items {
            id
            name
            subitems {
              id
              name
            }
          }
        }
      }
    }
  `, { boardId })

  return data.boards[0]?.items_page.items ?? []
}

export async function createSubitem(parentItemId: string, name: string) {
  const data = await query<{ create_subitem: { id: string } }>(`
    mutation ($parentItemId: ID!, $name: String!) {
      create_subitem(parent_item_id: $parentItemId, item_name: $name) {
        id
      }
    }
  `, { parentItemId, name })

  return data.create_subitem.id
}

export async function updateSubitemHours(itemId: string, columnId: string, hours: number) {
  await query(`
    mutation ($itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(item_id: $itemId, column_id: $columnId, value: $value) {
        id
      }
    }
  `, { itemId, columnId, value: JSON.stringify({ number: hours }) })
}

type MondayItem = {
  id: string
  name: string
  subitems: { id: string; name: string }[]
}
