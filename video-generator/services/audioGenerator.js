import axios from 'axios';
import fs from 'fs';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const writeFileAsync = promisify(fs.writeFile);

// Función para obtener las voces disponibles de ElevenLabs
export async function getElevenLabsVoices(apiKey) {
  try {
    console.log('Obteniendo voces disponibles de ElevenLabs...');
    const url = 'https://api.elevenlabs.io/v1/voices';
    const headers = {
      'Accept': 'application/json',
      'xi-api-key': apiKey
    };

    const response = await axios({
      method: 'get',
      url,
      headers,
      validateStatus: null
    });

    if (response.status !== 200) {
      throw new Error(`Error al obtener voces de ElevenLabs: ${response.status}`);
    }

    console.log('Voces disponibles en ElevenLabs:');
    const voices = response.data.voices;
    voices.forEach(voice => {
      console.log(`- ID: ${voice.voice_id}, Nombre: ${voice.name}, Género: ${voice.labels?.gender || 'No especificado'}, Idioma: ${voice.labels?.language || 'No especificado'}`);
    });

    return voices;
  } catch (error) {
    console.error(`Error al obtener voces de ElevenLabs: ${error.message}`);
    return [];
  }
}

export async function generateAudio(text, outputPath) {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

  console.log('\n--- Generación de audio ---');
  
  // Verificar si tenemos alguna API key configurada
  if (!ELEVENLABS_API_KEY && !GOOGLE_TTS_API_KEY) {
    console.log('No se encontraron API keys para servicios TTS. Se requiere configuración.');
    console.log('Por favor, configura ELEVENLABS_API_KEY o GOOGLE_TTS_API_KEY en el archivo .env');
  }
  
  // Intentar con ElevenLabs primero si está configurado
  if (ELEVENLABS_API_KEY) {
    try {
      console.log('ElevenLabs API key encontrada. Intentando generar audio con ElevenLabs...');
      
      // Obtener y mostrar las voces disponibles
      const voices = await getElevenLabsVoices(ELEVENLABS_API_KEY);
      
      return await generateElevenLabsAudio(text, outputPath, ELEVENLABS_API_KEY);
    } catch (error) {
      console.log(`ElevenLabs falló: ${error.message}`);
    }
  }
}

async function generateElevenLabsAudio(text, outputPath, apiKey) {
  try {
    // Usar una voz específica que sabemos que funciona
    // const voiceId = 'a0MaQpDjx7p7bZmqzFp1'; // Gaby - Young Student (voz en español)
    const voiceId = 'yiWEefwu5z3DQCM79clN';
    console.log(`Usando voz ID fija: ${voiceId}`);
    
    // Configuración simplificada para la solicitud
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const headers = {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey
    };
    const data = {
      text: text,
      model_id: 'eleven_multilingual_v2',
      // voice_settings: {
      //   stability: 0.5,
      //   similarity_boost: 0.5
      // }
      voice_settings: {
        stability: 0.2,            // Más baja = más expresivo y con variación emocional
        similarity_boost: 0.75,    // Más alto si quieres que suene fiel al timbre del voiceId
        style: 1.0,                // Subir estilo = más enfático y rápido (perfecto para TikTok)
        use_speaker_boost: true,
        speed: 1.2
      },
      optimize_streaming_latency: 4
    };
    
    // Realizar la solicitud a la API
    console.log(`Generando audio con voz ID: ${voiceId}`);
    
    const response = await axios({
      method: 'post',
      url,
      data,
      headers,
      responseType: 'arraybuffer',
      validateStatus: null // Para manejar nosotros los códigos de estado
    });

    // Verificar si la respuesta es un error
    if (response.status !== 200) {
      throw new Error(`Error al generar audio con ElevenLabs: ${response.status} ${response.data} ${response.message} ${response}`);
    }

    await writeFileAsync(outputPath, response.data);
    console.log(`Audio generado con ElevenLabs y guardado en: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`Error al generar audio con ElevenLabs: ${error.message}`);
    throw error;
  }
}

async function generateGoogleTTSAudio(text, outputPath, apiKey) {
  try {
    console.log('Intentando generar audio con Google TTS...');
    
    // Configuración de la solicitud
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const data = {
      input: { text: text },
      voice: {
        languageCode: 'es-ES',
        name: 'es-ES-Wavenet-B', // Voz masculina en español
        ssmlGender: 'MALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0.5,  // Ligeramente más agudo para mayor claridad
        speakingRate: 2.0  // El doble de rápido que el habla normal
      }
    };

    // Realizar la solicitud a la API
    const response = await axios.post(url, data);
    
    // Verificar que la respuesta contenga audioContent
    if (!response.data || !response.data.audioContent) {
      console.error('La respuesta de Google TTS no contiene audioContent:', response.data);
      throw new Error('Respuesta de Google TTS inválida');
    }
    
    // Decodificar el contenido de audio (base64)
    const audioContent = Buffer.from(response.data.audioContent, 'base64');
    
    // Guardar el archivo de audio
      await writeFileAsync(outputPath, audioContent);
      console.log(`Audio generado con Google TTS y guardado en: ${outputPath}`);
  } catch (error) {
    // Intentar extraer información más detallada del error
    let errorMessage = 'Error desconocido';
    
    if (error.response) {
      // La API respondió con un código de estado diferente de 2xx
      const statusCode = error.response.status;
      errorMessage = `Error ${statusCode}: ${error.response.statusText || 'Sin detalles'}`;
      
      // Intentar mostrar el cuerpo de la respuesta si existe
      if (error.response.data) {
        try {
          const errorData = typeof error.response.data === 'string' 
            ? JSON.parse(error.response.data) 
            : error.response.data;
          
          errorMessage += ` - ${JSON.stringify(errorData)}`;
        } catch (parseError) {
          // No hacer nada si no podemos parsear el error
        }
      }
      
      // Mensajes específicos según el código de estado
      if (statusCode === 400) {
        console.error('Error con Google TTS: Solicitud inválida. Verifica el formato de los datos.');
      } else if (statusCode === 401 || statusCode === 403) {
        console.error('Error con Google TTS: API key inválida o sin permisos suficientes.');
      }
    } else if (error.request) {
      // La solicitud fue realizada pero no se recibió respuesta
      errorMessage = 'No se recibió respuesta del servidor de Google TTS';
    } else {
      // Error al configurar la solicitud
      errorMessage = error.message;
    }
    console.error(`Error al generar audio con Google TTS: ${errorMessage}`);
  }
}