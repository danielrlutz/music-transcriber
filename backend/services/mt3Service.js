const axios = require('axios');

/**
 * Service responsible for communicating with the internal MT3 Transcription API.
 */
class Mt3Service {
    /**
     * Sends a Base64-encoded WAV file payload to the MT3 API for transcription.
     * 
     * @param {string} base64Data - The continuous Base64 string of the audio.
     * @returns {Promise<Buffer>} A promise that resolves to the raw binary (ArrayBuffer/Buffer) of the generated MIDI file.
     * @throws {Error} If the network request fails, times out, or the API returns an error.
     */
    static async transcribeAudio(base64Data) {
        const payload = { data: base64Data };
        // The URL of the downstream container is configurable, defaulting to localhost:5000.
        const mt3Url = process.env.MT3_API_URL || 'http://localhost:5000/transcribe-anything';
        
        console.log(`[Mt3Service] Initiating request to ${mt3Url}...`);
        
        try {
            const response = await axios.post(mt3Url, payload, {
                // Audio transcription can take a while; utilizing an extended 5-minute timeout.
                timeout: 300000, 
                // We expect a raw binary MIDI file stream back, not JSON.
                responseType: 'arraybuffer', 
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('[Mt3Service] Transcription successful. Binary MIDI received.');
            return response.data;
        } catch (error) {
            console.error('[Mt3Service] Transcription API error:', error.message || error);
            throw new Error(`MT3 API failed: ${error.message || String(error)}`);
        }
    }
}

module.exports = Mt3Service;
