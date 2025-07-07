import axios from 'axios';
import { randomUUID } from 'crypto';
const MAPBOX_BASE_URL = 'https://api.mapbox.com';
const GEOCODING_URL = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places`;
const SEARCH_URL = `${MAPBOX_BASE_URL}/search/searchbox/v1`;
const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
// const SESSION_TOKEN = process.env.MAPBOX_SESSION_TOKEN;
const sessionToken = randomUUID();
/**
 * Busca estabelecimentos próximos usando a API do Mapbox Search
 */
export async function searchNearbyPlaces({ latitude, longitude, radius, keyword, type }) {
  
  if (!ACCESS_TOKEN) {
    throw new Error('Token de acesso do Mapbox não configurado');
  }

  try {
    // Mapbox Search Box API - Suggest endpoint
    const response = await axios.get(`${SEARCH_URL}/suggest`, {
      params: {
        q: keyword,
        proximity: `${longitude},${latitude}`, // Mapbox usa longitude,latitude
        limit: 10,
        types: type || 'poi', // point of interest
        access_token: ACCESS_TOKEN,
        language: 'pt',
        session_token: sessionToken
      }
    });


    if (!response.data.suggestions) {
      return [];
    }

    // Para cada sugestão, buscar detalhes completos
    const detailedResults = await Promise.all(
      response.data.suggestions.slice(0, 10).map(async (suggestion) => {
        try {
          const detailResponse = await axios.get(`${SEARCH_URL}/retrieve/${suggestion.mapbox_id}`, {
            params: {
              access_token: ACCESS_TOKEN,
              session_token: sessionToken,
            }
          });

          const feature = detailResponse.data.features[0];
          if (!feature) return null;

          const coords = feature.geometry.coordinates;
          const properties = feature.properties;

          // Calcular distância aproximada
          const distance = calculateDistance(latitude, longitude, coords[1], coords[0]);
          
          // Filtrar por raio se especificado
          if (radius && distance > radius / 1000) {
            return null;
          }

          return {
            placeId: feature.properties.mapbox_id,
            name: properties.name || properties.full_address,
            address: properties.full_address || properties.place_formatted,
            location: {
              lat: coords[1],
              lng: coords[0]
            },
            category: properties.category,
            distance: distance,
            types: [properties.category].filter(Boolean),
            phone: properties.tel,
            website: properties.website
          };
        } catch (error) {
          console.error('Erro ao buscar detalhes do local:', error);
          return null;
        }
      })
    );

    return detailedResults.filter(result => result !== null);

  } catch (error) {
    // console.error(error.response?.data || error.message+ " - Erro ao buscar estabelecimentos próximos no Mapbox");
    console.error('Erro ao buscar estabelecimentos próximos no Mapbox:', error.message);
    throw new Error('Falha ao buscar dados do Mapbox');
  }
}

/**
 * Obtém detalhes completos de um estabelecimento pelo Mapbox ID
 */
export async function getPlaceDetails(mapboxId) {
  if (!ACCESS_TOKEN) {
    throw new Error('Token de acesso do Mapbox não configurado');
  }

  try {
    const response = await axios.get(`${SEARCH_URL}/retrieve/${mapboxId}`, {
      params: {
        access_token: ACCESS_TOKEN,
        session_token: sessionToken,
      }
    });

    const feature = response.data.features[0];
    if (!feature) {
      return null;
    }

    const coords = feature.geometry.coordinates;
    const properties = feature.properties;

    return {
      placeId: properties.mapbox_id,
      name: properties.name || properties.full_address,
      address: properties.full_address || properties.place_formatted,
      location: {
        lat: coords[1],
        lng: coords[0]
      },
      category: properties.category,
      phone: properties.tel,
      website: properties.website,
      types: [properties.category].filter(Boolean)
    };

  } catch (error) {
    console.error('Erro ao buscar detalhes do estabelecimento no Mapbox:', error.message);
    throw new Error('Falha ao buscar detalhes do estabelecimento');
  }
}

/**
 * Converte endereço em coordenadas (geocoding) usando Mapbox
 */
export async function geocodeAddress(address) {
  if (!ACCESS_TOKEN) {
    throw new Error('Token de acesso do Mapbox não configurado');
  }

  try {
    const response = await axios.get(`${GEOCODING_URL}/${encodeURIComponent(address)}.json`, {
      params: {
        access_token: ACCESS_TOKEN,
        country: 'br', // Foco no Brasil
        language: 'pt',
        limit: 1,
        session_token: sessionToken
      }
    });

    if (!response.data.features || response.data.features.length === 0) {
      return null;
    }

    const feature = response.data.features[0];
    const coords = feature.geometry.coordinates;

    return {
      formattedAddress: feature.place_name,
      location: {
        lat: coords[1],
        lng: coords[0]
      },
      placeId: feature.id,
      addressComponents: feature.context ? feature.context.map(component => ({
        longName: component.text,
        shortName: component.short_code || component.text,
        types: [component.id.split('.')[0]]
      })) : []
    };

  } catch (error) {
    console.error('Erro ao fazer geocoding no Mapbox:', error.message);
    throw new Error('Falha ao converter endereço em coordenadas');
  }
}

/**
 * Converte coordenadas em endereço (reverse geocoding) usando Mapbox
 */
export async function reverseGeocode(latitude, longitude) {
  if (!ACCESS_TOKEN) {
    throw new Error('Token de acesso do Mapbox não configurado');
  }

  try {
    const response = await axios.get(`${GEOCODING_URL}/${longitude},${latitude}.json`, {
      params: {
        access_token: ACCESS_TOKEN,
        country: 'br',
        language: 'pt',
        limit: 1,
        session_token: sessionToken
      }
    });

    if (!response.data.features || response.data.features.length === 0) {
      return null;
    }

    const feature = response.data.features[0];

    return {
      formattedAddress: feature.place_name,
      placeId: feature.id,
      addressComponents: feature.context ? feature.context.map(component => ({
        longName: component.text,
        shortName: component.short_code || component.text,
        types: [component.id.split('.')[0]]
      })) : []
    };

  } catch (error) {
    console.error('Erro ao fazer reverse geocoding no Mapbox:', error.message);
    throw new Error('Falha ao converter coordenadas em endereço');
  }
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

/**
 * Busca sugestões de locais para autocomplete
 */
export async function searchSuggestions(query, proximity) {
  if (!ACCESS_TOKEN) {
    throw new Error('Token de acesso do Mapbox não configurado');
  }

  try {
    const params = {
      q: query,
      access_token: ACCESS_TOKEN,
      language: 'pt',
      limit: 10,
      types: 'poi,address'
    };

    if (proximity) {
      params.proximity = `${proximity.longitude},${proximity.latitude}`;
    }

    const response = await axios.get(`${SEARCH_URL}/suggest`, { params });

    if (!response.data.suggestions) {
      return [];
    }

    return response.data.suggestions.map(suggestion => ({
      id: suggestion.mapbox_id,
      name: suggestion.name,
      fullText: suggestion.full_address || suggestion.name,
      category: suggestion.poi_category_ids?.[0] || 'place'
    }));

  } catch (error) {
    console.error('Erro ao buscar sugestões no Mapbox:', error.message);
    throw new Error('Falha ao buscar sugestões');
  }
}

/**
 * Obtém URL de imagem estática do mapa (Static Images API)
 */
export function getStaticMapUrl(latitude, longitude, zoom = 15, width = 400, height = 300) {
  if (!ACCESS_TOKEN) {
    return null;
  }

  return `${MAPBOX_BASE_URL}/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${longitude},${latitude})/${longitude},${latitude},${zoom}/${width}x${height}?access_token=${ACCESS_TOKEN}`;
}

