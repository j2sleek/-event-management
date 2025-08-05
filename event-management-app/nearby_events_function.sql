-- Drop existing function if it exists
DROP FUNCTION IF EXISTS nearby_events(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

-- Create the nearby_events function for geospatial queries
CREATE OR REPLACE FUNCTION public.nearby_events(
  lat DOUBLE PRECISION,
  long DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 50000
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE,
  location GEOGRAPHY,
  creator_id UUID,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.description,
    e.date,
    e.location,
    e.creator_id,
    e.category_id,
    e.created_at,
    ST_Distance(
      e.location::geometry,
      ST_SetSRID(ST_MakePoint(long, lat), 4326)::geometry
    ) / 1000 AS distance_km
  FROM events e
  WHERE ST_DWithin(
    e.location::geometry,
    ST_SetSRID(ST_MakePoint(long, lat), 4326)::geometry,
    radius_meters
  )
  AND e.date >= NOW()
  ORDER BY distance_km ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.nearby_events(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION public.nearby_events(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO anon;