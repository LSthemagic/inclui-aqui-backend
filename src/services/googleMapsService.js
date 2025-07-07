import axios from 'axios';

const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const PLACE_DETAILS_API_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
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

/**
 * Obtém detalhes completos de um estabelecimento pelo Place ID
 */
export async function getPlaceDetails(placeId) {
  if (!API_KEY) {
    throw new Error('Chave da API do Google Maps não configurada');
  }

  try {
    const response = await axios.get(PLACE_DETAILS_API_URL, {
      params: {
        place_id: placeId,
        fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,website,opening_hours,photos,types,price_level',
        key: API_KEY,
        language: 'pt-BR',
      },
    });

    if (response.data.status !== 'OK') {
      console.error('Erro na API do Google Places Details:', response.data.error_message || response.data.status);
      return null;
    }

    const place = response.data.result;
    
    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      phone: place.formatted_phone_number,
      website: place.website,
      openingHours: place.opening_hours ? {
        openNow: place.opening_hours.open_now,
        weekdayText: place.opening_hours.weekday_text
      } : null,
      photos: place.photos ? place.photos.map(photo => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height
      })) : [],
      types: place.types,
      priceLevel: place.price_level
    };

  } catch (error) {
    console.error('Erro ao buscar detalhes do estabelecimento:', error.message);
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
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distância em km
  
  return Math.round(distance * 100) / 100; // Arredondar para 2 casas decimais
}

