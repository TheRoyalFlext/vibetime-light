import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Bonjour, {session.user?.name?.split(" ")[0]}</h1>
      <p className="text-sm text-gray-500 mt-1">Dashboard Vibetime Light</p>
    </div>
  )
}
