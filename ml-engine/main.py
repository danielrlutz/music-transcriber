import os
import base64
import tempfile
import logging
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from basic_pitch.inference import predict
import pretty_midi

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Demucs + Basic Pitch ML API")

class TranscriptionRequest(BaseModel):
    data: str  # Base64 encoded WAV file

# Map stems to General MIDI instrument numbers
# 52: Choir Aahs (Vocals)
# 33: Electric Bass (finger)
# 0: Acoustic Grand Piano (Other/Chords)
STEM_INSTRUMENTS = {
    'vocals.wav': 52,
    'bass.wav': 33,
    'other.wav': 0,
    # Skipping drums.wav because basic-pitch tracks pitch, not percussion
}

def process_audio(wav_path: str, output_midi_path: str):
    logger.info(f"Starting source separation on {wav_path}...")
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # 1. Run Demucs CLI to separate stems
        try:
            subprocess.run(
                ["demucs", "-n", "htdemucs", wav_path, "-o", temp_dir],
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            logger.error(f"Demucs failed: {e.stderr}")
            raise RuntimeError(f"Source separation failed: {e.stderr}")

        # Demucs output path: {temp_dir}/htdemucs/{basename}/
        basename = os.path.splitext(os.path.basename(wav_path))[0]
        stems_dir = os.path.join(temp_dir, "htdemucs", basename)
        
        merged_midi = pretty_midi.PrettyMIDI()
        
        # 2. Run Basic Pitch on each stem
        for stem_file, program_num in STEM_INSTRUMENTS.items():
            stem_path = os.path.join(stems_dir, stem_file)
            if not os.path.exists(stem_path):
                logger.warning(f"Stem {stem_file} not found, skipping...")
                continue
                
            logger.info(f"Transcribing stem: {stem_file}...")
            try:
                model_output, midi_data, note_events = predict(stem_path)
                
                # Assign the correct MIDI instrument
                for instrument in midi_data.instruments:
                    instrument.program = program_num
                    merged_midi.instruments.append(instrument)
            except Exception as e:
                logger.error(f"Failed to transcribe {stem_file}: {str(e)}")
                
        # 3. Save merged MIDI
        merged_midi.write(output_midi_path)
        logger.info("Transcription complete. MIDI saved.")

@app.post("/transcribe-anything")
async def transcribe(request: TranscriptionRequest):
    """
    Receives a Base64 encoded WAV file, separates it using Demucs, 
    transcribes it using Basic Pitch, and returns a multitrack MIDI.
    """
    try:
        audio_bytes = base64.b64decode(request.data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode Base64 data: {str(e)}")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as wav_file:
        wav_file.write(audio_bytes)
        wav_path = wav_file.name

    midi_path = wav_path.replace(".wav", ".mid")

    try:
        process_audio(wav_path, midi_path)

        if not os.path.exists(midi_path):
            raise HTTPException(status_code=500, detail="Engine failed to output a MIDI file.")

        return FileResponse(
            path=midi_path, 
            media_type="audio/midi", 
            filename="transcription.mid",
            background=None
        )

    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        # Send explicit error to frontend
        raise HTTPException(status_code=500, detail=f"Transcription pipeline error: {str(e)}")
    finally:
        # Cleanup
        if os.path.exists(wav_path):
            os.remove(wav_path)
        # Note: midi_path is cleaned up by FileResponse background task if we used one, 
        # but here it might leak. Since it's /tmp, it's fine for this scale, or we can use BackgroundTasks.

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
