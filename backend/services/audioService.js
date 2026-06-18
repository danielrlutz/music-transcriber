const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

/**
 * Service responsible for audio manipulation and transcoding.
 * Uses fluent-ffmpeg to wrap the system's ffmpeg installation.
 */
class AudioService {
    /**
     * Transcodes an input audio file into a strict 16kHz, mono, 16-bit PCM WAV.
     * This format is required by the MT3 transcription engine.
     * 
     * @param {string} inputPath - The absolute path to the uploaded input file.
     * @param {string} outputPath - The absolute path where the transcoded WAV should be saved.
     * @returns {Promise<void>} Resolves when the transcoding is complete.
     * @throws {Error} If ffmpeg encounters an error during processing.
     */
    static async transcodeToWav(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('wav')
                .audioChannels(1)
                .audioFrequency(16000)
                .audioCodec('pcm_s16le')
                .on('end', () => resolve())
                .on('error', (err) => reject(new Error(`FFmpeg transcoding failed: ${err.message}`)))
                .save(outputPath);
        });
    }

    /**
     * Reads a file from the filesystem and converts it into a Base64 encoded string.
     * 
     * @param {string} filePath - The absolute path to the file to encode.
     * @returns {Promise<string>} A promise that resolves to the Base64 representation of the file.
     * @throws {Error} If the file cannot be read.
     */
    static async getBase64EncodedFile(filePath) {
        try {
            const fileBuffer = await fs.promises.readFile(filePath);
            return fileBuffer.toString('base64');
        } catch (error) {
            throw new Error(`Failed to read and encode file: ${error.message}`);
        }
    }
}

module.exports = AudioService;
