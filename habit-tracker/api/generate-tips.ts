import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { profile, habits, recentProgress, location } = req.body

    const tips = await generatePersonalizedTips({
      profile,
      habits,
      recentProgress,
      location,
    })

    res.status(200).json(tips)
  } catch (error) {
    console.error("Error generating tips:", error)
    res.status(500).json({ message: "Failed to generate tips" })
  }
}

async function generatePersonalizedTips(userContext: any) {
  const { profile, habits, recentProgress } = userContext

  // Calculate user statistics
  const totalHabits = habits.length
  const strugglingHabits = habits.filter((h: any) => h.completion_rate < 50)
  const successfulHabits = habits.filter((h: any) => h.completion_rate >= 80)

  // Recent performance analysis
  const recentCompletions = recentProgress.filter((p: any) => p.completed).length
  const recentTotal = recentProgress.length
  const recentSuccessRate = recentTotal > 0 ? (recentCompletions / recentTotal) * 100 : 0

  // Build context for AI
  const contextPrompt = `
    User Profile:
    - Age: ${profile.age || "Not specified"}
    - Gender: ${profile.gender || "Not specified"}
    - Activity Level: ${profile.activity_level || "Not specified"}
    - Sleep Hours: ${profile.sleep_hours || "Not specified"} hours per night
    - Stress Level: ${profile.stress_level || "Not specified"}/10
    - Location: ${profile.location || "Not specified"}
    
    Habit Statistics:
    - Total Habits: ${totalHabits}
    - Struggling Habits: ${strugglingHabits.length}
    - Successful Habits: ${successfulHabits.length}
    - Recent Success Rate: ${recentSuccessRate.toFixed(1)}%
    
    Current Habits:
    ${habits.map((h: any) => `- ${h.name} (${h.type}, ${h.completion_rate}% success rate)`).join("\n")}
    
    Generate 3-5 personalized tips to help this user improve their habit formation and maintenance.
    Consider their biodata, current performance, and specific challenges.
    Make tips actionable, specific, and encouraging.
  `

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: contextPrompt,
    system: `You are a habit formation expert and wellness coach. Generate personalized, actionable tips based on user data. 
    Format your response as a JSON array of objects with properties: content, type, habitId (if specific to a habit, otherwise null).
    Types can be: 'motivation', 'strategy', 'health', 'timing', 'environment'.`,
  })

  try {
    return JSON.parse(text)
  } catch {
    // Fallback if AI doesn't return valid JSON
    return [
      {
        content: text,
        type: "general",
        habitId: null,
      },
    ]
  }
}
