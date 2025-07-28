import { z } from 'zod';
import { 
  searchNearbyPlaces, 
  getPlaceDetails, 
  geocodeAddress, 
  reverseGeocode,
  calculateDistance,
  getPhotoUrl,
  // searchSuggestions,
  // getStaticMapUrl
} from '../../services/googleMapsService.js';
import { 
  searchNearbyQuerySchema,
  geocodeQuerySchema,
  reverseGeocodeQuerySchema,
  placeDetailsParamsSchema,
  placeResponseSchema,
  placeDetailsResponseSchema,
  geocodeResponseSchema
} from './placesSchemas.js';

export async function placesRoutes(fastify) {
  // Buscar estabelecimentos próximos
  fastify.get('/search-nearby', {
    schema: {
      tags: ['Google Places'],
      summary: 'Buscar estabelecimentos próximos',
      description: 'Busca estabelecimentos próximos usando a API do Google',
      querystring: searchNearbyQuerySchema,
      response: {
        200: z.array(placeResponseSchema),
        500: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { lat, lng, radius, keyword, type } = request.query;

    try {
      const places = await searchNearbyPlaces({
        latitude: lat,
        longitude: lng,
        radius,
        keyword,
        type
      });
      console.log("Places found:", places);

      return reply.send(places);
    } catch (error) {
      fastify.log.error('Erro ao buscar estabelecimentos proximos:', error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  });

  // Obter detalhes de um estabelecimento
  fastify.get('/details/:placeId', {
  }, async (request, reply) => {
    const { placeId } = request.params;

    try {
      const placeDetails = await getPlaceDetails(placeId);

      if (!placeDetails) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Estabelecimento não encontrado'
        });
      }

      return reply.send(placeDetails);
    } catch (error) {
      fastify.log.error('Erro ao buscar detalhes do estabelecimento:', error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  });

  // Geocoding - converter endereço em coordenadas
  fastify.get('/geocode', {
    schema: {
      tags: ['Google Places'],
      summary: 'Geocoding',
      description: 'Converte endereço em coordenadas usando Google',
      querystring: geocodeQuerySchema,
      response: {
        200: geocodeResponseSchema,
        404: z.object({ error: z.string(), message: z.string() }),
        500: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { address } = request.query;

    try {
      const result = await geocodeAddress(address);

      if (!result) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Endereço não encontrado'
        });
      }

      return reply.send(result);
    } catch (error) {
      fastify.log.error('Erro ao fazer geocoding:', error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  });

  // Reverse Geocoding - converter coordenadas em endereço
  fastify.get('/reverse-geocode', {
    schema: {
      tags: ['Google Places'],
      summary: 'Reverse Geocoding',
      description: 'Converte coordenadas geográficas em endereço usando Google',
      querystring: reverseGeocodeQuerySchema,
      response: {
        200: geocodeResponseSchema,
        404: z.object({ error: z.string(), message: z.string() }),
        500: z.object({ error: z.string(), message: z.string() })
      }
    }
  }, async (request, reply) => {
    const { lat, lng } = request.query;

    try {
      const result = await reverseGeocode(lat, lng);

      if (!result) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Endereço não encontrado para as coordenadas fornecidas'
        });
      }

      return reply.send(result);
    } catch (error) {
      fastify.log.error('Erro no reverse geocoding:', error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  });

  // Calcular distância entre dois pontos
  fastify.get('/distance', {
    schema: {
      tags: ['Google Places'],
      summary: 'Calcular distância',
      description: 'Calcula a distância entre duas coordenadas geográficas',
      querystring: z.object({
        lat1: z.coerce.number().min(-90).max(90),
        lng1: z.coerce.number().min(-180).max(180),
        lat2: z.coerce.number().min(-90).max(90),
        lng2: z.coerce.number().min(-180).max(180)
      }),
      response: {
        200: z.object({
          distance: z.number().describe('Distância em quilômetros'),
          unit: z.string().default('km')
        })
      }
    }
  }, async (request, reply) => {
    const { lat1, lng1, lat2, lng2 } = request.query;

    try {
      const distance = calculateDistance(lat1, lng1, lat2, lng2);

      return reply.send({
        distance,
        unit: 'km'
      });
    } catch (error) {
      fastify.log.error('Erro ao calcular distância:', error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        message: error.message 
      });
    }
  });

  fastify.get('/picture', {}, async (request, reply) => {
     const { photoReference, maxWidth } = request.query;
     const response = await getPhotoUrl(photoReference, maxWidth);
     if (!response) {
       return reply.status(500).send({
         error: 'Internal Server Error',
         message: 'Token do Google não configurado ou referência de foto inválida'
       });
     }
     console.log("Photo URL Response:", response);
     // Retorna a URL da foto
     return reply.send({ url: response });
  } )

  // Buscar sugestões para autocomplete
  // fastify.get('/suggestions', {
  //   schema: {
  //     tags: ['Google Places'],
  //     summary: 'Buscar sugestões',
  //     description: 'Busca sugestões de locais para autocomplete usando Google',
  //     querystring: z.object({
  //       q: z.string().min(1).describe('Termo de busca'),
  //       lat: z.coerce.number().min(-90).max(90).optional().describe('Latitude para proximidade'),
  //       lng: z.coerce.number().min(-180).max(180).optional().describe('Longitude para proximidade')
  //     }),
  //     response: {
  //       200: z.array(z.object({
  //         id: z.string(),
  //         name: z.string(),
  //         fullText: z.string(),
  //         category: z.string()
  //       })),
  //       500: z.object({ error: z.string(), message: z.string() })
  //     }
  //   }
  // }, async (request, reply) => {
  //   const { q, lat, lng } = request.query;

  //   try {
  //     const proximity = lat && lng ? { latitude: lat, longitude: lng } : null;
  //     const suggestions = await searchSuggestions(q, proximity);

  //     return reply.send(suggestions);
  //   } catch (error) {
  //     fastify.log.error('Erro ao buscar sugestões:', error);
  //     return reply.status(500).send({ 
  //       error: 'Internal Server Error',
  //       message: error.message 
  //     });
  //   }
  // });

  // Obter URL de mapa estático
//   fastify.get('/static-map', {
//     schema: {
//       tags: ['Google Places'],
//       summary: 'Obter URL de mapa estático',
//       description: 'Gera URL para imagem estática do mapa usando Google',
//       querystring: z.object({
//         lat: z.coerce.number().min(-90).max(90),
//         lng: z.coerce.number().min(-180).max(180),
//         zoom: z.coerce.number().min(1).max(20).default(15),
//         width: z.coerce.number().min(100).max(1280).default(400),
//         height: z.coerce.number().min(100).max(1280).default(300)
//       }),
//       response: {
//         200: z.object({
//           url: z.string().url()
//         }),
//         500: z.object({ error: z.string(), message: z.string() })
//       }
//     }
//   }, async (request, reply) => {
//     const { lat, lng, zoom, width, height } = request.query;

//     try {
//       const url = getStaticMapUrl(lat, lng, zoom, width, height);

//       if (!url) {
//         return reply.status(500).send({
//           error: 'Internal Server Error',
//           message: 'Token do Google não configurado'
//         });
//       }

//       return reply.send({ url });
//     } catch (error) {
//       fastify.log.error('Erro ao gerar URL do mapa estático:', error);
//       return reply.status(500).send({ 
//         error: 'Internal Server Error',
//         message: error.message 
//       });
//     }
//   });

}