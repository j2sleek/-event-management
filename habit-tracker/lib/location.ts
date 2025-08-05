import * as Location from "expo-location"

export interface LocationData {
  latitude: number
  longitude: number
  city?: string
  country?: string
  timezone?: string
}

export const getCurrentLocation = async (): Promise<LocationData | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      console.log("Permission to access location was denied")
      return null
    }

    const location = await Location.getCurrentPositionAsync({})
    const { latitude, longitude } = location.coords

    // Get address details
    const address = await Location.reverseGeocodeAsync({ latitude, longitude })
    const addressInfo = address[0]

    return {
      latitude,
      longitude,
      city: addressInfo?.city || undefined,
      country: addressInfo?.country || undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  } catch (error) {
    console.error("Error getting location:", error)
    return null
  }
}
