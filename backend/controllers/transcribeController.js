const fs = require('fs');
const path = require('path');
const os = require('os');
const AudioService = require('../services/audioService');
const Mt3Service = require('../services/mt3Service');

/**
 * Controller to handle the core transcription business logic and HTTP lifecycle.
 */
class TranscribeController {
    /**
     * Express route handler for POST /api/transcribe.
     * Orchestrates the audio transcoding, Base64 conversion, API forwarding, and response serving.
     * 
     * @param {import('express').Request} req - The Express request object. Should contain `req.file`.
     * @param {import('express').Response} res - The Express response object.
     * @returns {Promise<void>} 
     */
    static async handleTranscription(req, res) {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const inputPath = req.file.path;
        // Generate a unique temporary output path for the WAV file
        const outputPath = path.join(os.tmpdir(), `${req.file.filename}_converted.wav`);

        try {
            console.log(`[TranscribeController] Processing upload: ${req.file.originalname}`);

            // 1. Transcode incoming file to the strict WAV profile needed by MT3
            console.log('[TranscribeController] Transcoding audio...');
            await AudioService.transcodeToWav(inputPath, outputPath);

            // 2. Read back the WAV and encode as Base64
            console.log('[TranscribeController] Encoding audio to Base64...');
            const base64Data = await AudioService.getBase64EncodedFile(outputPath);

            // 3. Post to the MT3 API and retrieve the MIDI buffer
            const midiBuffer = await Mt3Service.transcribeAudio(base64Data);

            // 4. Send the binary MIDI payload back to the client
            const originalName = req.file.originalname.replace(/\.[^/.]+$/, "");
            res.set({
                'Content-Type': 'audio/midi',
                'Content-Disposition': `attachment; filename="${originalName}_transcribed.mid"`
            });
            res.send(midiBuffer);

            console.log('[TranscribeController] Response successfully sent to client.');

        } catch (error) {
            console.error('[TranscribeController] Error during request:', error.message || error);
            res.status(500).json({ error: 'Transcription failed', details: error.message || String(error) });
        } finally {
            // 5. Always cleanup temporary files, regardless of success or failure
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            } catch (cleanupError) {
                console.error('[TranscribeController] Temp file cleanup error:', cleanupError);
            }
        }
    }
}

module.exports = TranscribeController;
