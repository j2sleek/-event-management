"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet } from "react-native"
import { supabase } from "../lib/supabase"
import AuthScreen from "../components/AuthScreen"
import MainApp from "../components/MainApp"
import ProfileSetup from "../components/ProfileSetup"
import type { Session } from "@supabase/supabase-js"

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkProfileComplete(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkProfileComplete(session.user.id)
      } else {
        setProfileComplete(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkProfileComplete = async (userId: string) => {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

    setProfileComplete(profile && profile.full_name && profile.age && profile.gender && profile.activity_level)
  }

  if (loading) {
    return <View style={styles.container} />
  }

  if (!session) {
    return <AuthScreen />
  }

  if (!profileComplete) {
    return <ProfileSetup userId={session.user.id} onComplete={() => setProfileComplete(true)} />
  }

  return <MainApp session={session} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
})
