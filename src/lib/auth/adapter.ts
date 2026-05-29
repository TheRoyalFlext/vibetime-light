import type { Adapter, AdapterUser, AdapterSession, AdapterAccount } from "next-auth/adapters"
import { createServiceClient } from "@/lib/supabase/server"

export function SupabaseLightAdapter(): Adapter {
  return {
    async createUser(user) {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .schema("light")
        .from("users")
        .insert({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          role: "USER",
        })
        .select()
        .single()

      if (error) throw error
      return toAdapterUser(data)
    },

    async getUser(id) {
      const supabase = createServiceClient()
      const { data } = await supabase
        .schema("light")
        .from("users")
        .select()
        .eq("id", id)
        .single()

      return data ? toAdapterUser(data) : null
    },

    async getUserByEmail(email) {
      const supabase = createServiceClient()
      const { data } = await supabase
        .schema("light")
        .from("users")
        .select()
        .eq("email", email)
        .single()

      return data ? toAdapterUser(data) : null
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const supabase = createServiceClient()
      const { data } = await supabase
        .schema("light")
        .from("accounts")
        .select("*, users(*)")
        .eq("provider", provider)
        .eq("provider_account_id", providerAccountId)
        .single()

      if (!data?.users) return null
      return toAdapterUser(data.users as Record<string, unknown>)
    },

    async updateUser(user) {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .schema("light")
        .from("users")
        .update({ name: user.name, image: user.image })
        .eq("id", user.id!)
        .select()
        .single()

      if (error) throw error
      return toAdapterUser(data)
    },

    async linkAccount(account) {
      const supabase = createServiceClient()
      await supabase.schema("light").from("accounts").insert({
        user_id: account.userId,
        provider: account.provider,
        provider_account_id: account.providerAccountId,
        access_token: account.access_token,
        refresh_token: account.refresh_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
      })
      return account as AdapterAccount
    },

    async createSession(session) {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .schema("light")
        .from("sessions")
        .insert({
          user_id: session.userId,
          session_token: session.sessionToken,
          expires: session.expires.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return {
        userId: data.user_id,
        sessionToken: data.session_token,
        expires: new Date(data.expires),
      }
    },

    async getSessionAndUser(sessionToken) {
      const supabase = createServiceClient()
      const { data } = await supabase
        .schema("light")
        .from("sessions")
        .select("*, users(*)")
        .eq("session_token", sessionToken)
        .gt("expires", new Date().toISOString())
        .single()

      if (!data?.users) return null
      return {
        session: {
          userId: data.user_id,
          sessionToken: data.session_token,
          expires: new Date(data.expires),
        },
        user: toAdapterUser(data.users as Record<string, unknown>),
      }
    },

    async updateSession(session) {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .schema("light")
        .from("sessions")
        .update({ expires: session.expires?.toISOString() })
        .eq("session_token", session.sessionToken)
        .select()
        .single()

      if (error) throw error
      return {
        userId: data.user_id,
        sessionToken: data.session_token,
        expires: new Date(data.expires),
      }
    },

    async deleteSession(sessionToken) {
      const supabase = createServiceClient()
      await supabase
        .schema("light")
        .from("sessions")
        .delete()
        .eq("session_token", sessionToken)
    },
  }
}

function toAdapterUser(row: Record<string, unknown>): AdapterUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) ?? null,
    image: (row.image as string) ?? null,
    emailVerified: null,
  }
}
