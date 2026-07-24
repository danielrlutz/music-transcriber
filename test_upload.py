import requests
import sys

def test_transcription():
    url = "http://debi9:5678/api/transcribe"
    file_path = "P:/Users/danie/Downloads/Isabel LaRosa - Hallucination (Instrumental) - XKYLAAR (1).mp3"
    
    print(f"Uploading {file_path} to {url}...")
    
    try:
        with open(file_path, "rb") as f:
            files = {"audio": ("Isabel.mp3", f, "audio/mpeg")}
            response = requests.post(url, files=files)
            
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            out_file = "P:/Users/danie/Downloads/Isabel_Transcribed.mid"
            with open(out_file, "wb") as f:
                f.write(response.content)
            print(f"SUCCESS! Saved MIDI to {out_file}")
        else:
            print(f"FAILED. Server returned: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_transcription()
