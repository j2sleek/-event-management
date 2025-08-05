import { supabase } from "./supabase"

interface UserContext {
  profile: any
  habits: any[]
  recentProgress: any[]
  location?: any
}

export const generatePersonalizedTips = async (userId: string): Promise<void> => {
  try {
    // Get user context
    const userContext = await getUserContext(userId)

    // Generate tips using AI
    const tips = await callAIEndpoint(userContext)

    // Save tips to database
    await saveTipsToDatabase(userId, tips)
  } catch (error) {
    console.error("Error generating personalized tips:", error)
  }
}

const getUserContext = async (userId: string): Promise<UserContext> => {
  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  // Get user habits
  const { data: habits } = await supabase.from("habits").select("*").eq("user_id", userId)

  // Get recent progress (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentProgress } = await supabase
    .from("habit_progress")
    .select("*")
    .eq("user_id", userId)
    .gte("date", thirtyDaysAgo.toISOString())

  return {
    profile,
    habits: habits || [],
    recentProgress: recentProgress || [],
  }
}

const callAIEndpoint = async (userContext: UserContext) => {
  const response = await fetch("/api/generate-tips", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userContext),
  })

  if (!response.ok) {
    throw new Error("Failed to generate tips")
  }

  return response.json()
}

const saveTipsToDatabase = async (userId: string, tips: any[]) => {
  const tipsToInsert = tips.map((tip) => ({
    user_id: userId,
    habit_id: tip.habitId || null,
    tip_content: tip.content,
    tip_type: tip.type,
    is_read: false,
  }))

  await supabase.from("ai_tips").insert(tipsToInsert)
}
