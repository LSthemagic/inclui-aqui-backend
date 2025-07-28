import axios from 'axios';

const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const PLACE_DETAILS_API_URL = 'https://places.googleapis.com/v1/places';
const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/**
 * Busca estabelecimentos próximos usando a API do Google Places
 */
export async function searchNearbyPlaces({ latitude, longitude, radius, keyword, type }) {
  if (!API_KEY) {
    throw new Error('Chave da API do Google Maps não configurada');
  }

  const location = `${latitude},${longitude}`;

  try {
    const response = await axios.get(PLACES_API_URL, {
      params: {
        location,
        radius,
        keyword,
        type,
        key: API_KEY,
        language: 'pt-BR',
      },
    });

    if (response.data.status !== 'OK') {
      console.error('Erro na API do Google Places:', response.data.error_message || response.data.status);
      return [];
    }

    const simplifiedResults = response.data.results.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      priceLevel: place.price_level,
      photos: place.photos ? place.photos.map(photo => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : []
    }));

    return simplifiedResults;

  } catch (error) {
    console.error('Erro ao chamar a API do Google Maps:', error.message);
    throw new Error('Falha ao buscar dados do Google Maps');
  }
}

export async function getPlaceDetails(placeId) {
  if (!API_KEY) {
    throw new Error('Chave da API do Google Maps não configurada');
  }

  try {
    // Campos do NEW API
    const fields = [
      'id',
      'displayName',
      'reviews',
      'formattedAddress',
      'location',
      'rating',
      'userRatingCount',
      'internationalPhoneNumber',
      'websiteUri',
      'regularOpeningHours',
      'types',
      'priceLevel',
      'accessibilityOptions'
    ].join(',');

    const url = `${PLACE_DETAILS_API_URL}/${placeId}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': fields
      }
    });


    const place = response.data; // no NEW API já vem direto

    return {
      placeId: place.id,
      name: place.displayName?.text || 'Sem nome',
      address: place.formattedAddress,
      location: {
        lat: place.location?.latitude,
        lng: place.location?.longitude,
      },
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      phone: place.internationalPhoneNumber || null,
      website: place.websiteUri || null,
      openingHours: place.regularOpeningHours
        ? {
          openNow: place.regularOpeningHours.openNow,
          weekdayText: place.regularOpeningHours.weekdayDescriptions
        }
        : null,
      types: place.types || [],
      priceLevel: place.priceLevel || null,
      reviews: Array.isArray(place.reviews)
        ? place.reviews.map((r) => ({
          id: r.name,
          rating: r.rating,
          comment: r.text?.text || '',
          title: r.originalText?.text || '',
          createdAt: r.publishTime,
          owner: {
            name: r.authorAttribution?.displayName || 'Anônimo',
            id: r.authorAttribution?.uri || ''
          }
        }))
        : [],
      accessibility: place.accessibilityOptions
        ? {
          entrance: place.accessibilityOptions.wheelchairAccessibleEntrance ?? null,
          restroom: place.accessibilityOptions.wheelchairAccessibleRestroom ?? null,
          seating: place.accessibilityOptions.wheelchairAccessibleSeating ?? null,
          parking: place.accessibilityOptions.wheelchairAccessibleParking ?? null
        }
        : null
    };

  } catch (error) {
    console.error('Erro ao buscar detalhes do estabelecimento (NEW API):', error.response?.data || error.message);
    throw new Error('Falha ao buscar detalhes do estabelecimento');
  }
}


/**
 * Converte endereço em coordenadas (geocoding)
 */
export async function geocodeAddress(address) {
  if (!API_KEY) {
    throw new Error('Chave da API do Google Maps não configurada');
  }

  try {
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        address,
        key: API_KEY,
        language: 'pt-BR',
        region: 'br'
      },
    });

    if (response.data.status !== 'OK') {
      console.error('Erro na API de Geocoding:', response.data.error_message || response.data.status);
      return null;
    }

    const result = response.data.results[0];

    return {
      formattedAddress: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      placeId: result.place_id,
      addressComponents: result.address_components.map(component => ({
        longName: component.long_name,
        shortName: component.short_name,
        types: component.types
      }))
    };

  } catch (error) {
    console.error('Erro ao fazer geocoding do endereço:', error.message);
    throw new Error('Falha ao converter endereço em coordenadas');
  }
}

/**
 * Converte coordenadas em endereço (reverse geocoding)
 */
export async function reverseGeocode(latitude, longitude) {
  if (!API_KEY) {
    throw new Error('Chave da API do Google Maps não configurada');
  }

  try {
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: API_KEY,
        language: 'pt-BR',
        region: 'br'
      },
    });

    if (response.data.status !== 'OK') {
      console.error('Erro na API de Reverse Geocoding:', response.data.error_message || response.data.status);
      return null;
    }

    const result = response.data.results[0];

    return {
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      addressComponents: result.address_components.map(component => ({
        longName: component.long_name,
        shortName: component.short_name,
        types: component.types
      }))
    };

  } catch (error) {
    console.error('Erro ao fazer reverse geocoding:', error.message);
    throw new Error('Falha ao converter coordenadas em endereço');
  }
}

/**
 * Gera URL para foto do Google Places
 */
export function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!API_KEY || !photoReference) {
    return null;
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${API_KEY}`;
}

/**
 * Calcula distância entre duas coordenadas usando a fórmula de Haversine
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distância em km

  return Math.round(distance * 100) / 100; // Arredondar para 2 casas decimais
}

export const getRouteCoordinates = async (origin, destination) => {
  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr = `${destination.latitude},${destination.longitude}`;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${API_KEY}&mode=walking`
  );

  const data = await response.json();
  console.log("Directions API Response:", data);
  if (!data.routes || data.routes.length === 0) {
    throw new Error('Nenhuma rota encontrada');
  }

  const points = decodePolyline(data.routes[0].overview_polyline.points);
  return points;
};

function decodePolyline(encoded) {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
}
