import { useState, useRef } from "react";

/**
 * Hook wrapping the functionality of the MediaRecorder API.
 * See https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder for more information.
 * @returns isRecording: boolean, startRecording: () => void, stopRecording: () => void
 */
export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const constraints = { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone: ", err);
    }
  };

  const stopRecording = async (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return;

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    });
  };

  return { isRecording, startRecording, stopRecording };
}
