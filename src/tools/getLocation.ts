export interface NominatimResponse {
  lat: string;
  lon: string;
  address?: any;
  name?: string;
}

export async function getLocation(
  location: string
): Promise<{ latitude: number; longitude: number; locationName: string } | null> {
  try {
    const params = new URLSearchParams({
      q: location,
      format: 'json',
      limit: '1',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          'User-Agent': 'umo-bot',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimResponse[];

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      locationName: result.address?.city || result.address?.town || result.name || location,
    };
  } catch (error: any) {
    console.error(`Failed to get coordinates from location: ${error.message}`);
    return null;
  }
}