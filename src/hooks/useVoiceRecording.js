import { useRef, useEffect } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { useRecordVoice } from "@/hooks/useVoiceRecorder";
import { blobToBase64, exportWAV } from "@/lib/utils";

export const useVoiceRecording = ({ savedSettings, onSpeechStart, onSpeechEnd, onTranscriptionChange }) => {
  const {
    startRecording,
    stopRecording,
    recording,
    getText,
    setTranscription,
    transcription,
    text: newText,
  } = useRecordVoice();

  const curationTimerRef = useRef(null);
  const transcriptionRef = useRef(transcription);

  useEffect(() => {
    transcriptionRef.current = transcription;
    if (savedSettings?.recording === "MANUAL") {
      startCurationTimer();
    }
    onTranscriptionChange?.(transcription);
  }, [transcription]);

  const vad = useMicVAD({
    onSpeechEnd: async (audio) => {
      console.log("User stopped talking");
      onSpeechEnd?.("Transcribing your audio...");
      const audioBlob = exportWAV(audio, 16000);
      blobToBase64(audioBlob, getText);
      startCurationTimer();
    },
    onSpeechStart: () => {
      console.log("User started talking");
      onSpeechStart?.("Listening...");
      if (curationTimerRef.current) {
        clearTimeout(curationTimerRef.current);
        curationTimerRef.current = null;
      }
    },
    startOnLoad: savedSettings?.recording === "VAD",
  });

  const startCurationTimer = () => {
    if (curationTimerRef.current) {
      clearTimeout(curationTimerRef.current);
    }

    curationTimerRef.current = setTimeout(() => {
      if (transcriptionRef.current) {
        onTranscriptionChange?.(transcriptionRef.current);
      }
    }, 4000);
  };

  useEffect(() => {
    if (savedSettings?.recording === "MANUAL") {
      vad.pause();
    } else {
      vad.start();
    }
  }, [savedSettings?.recording]);

  useEffect(() => {
    return () => {
      if (curationTimerRef.current) {
        clearTimeout(curationTimerRef.current);
      }
    };
  }, []);

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    recording,
    toggleRecording,
    vad,
    transcription,
    newText,
    setTranscription,
  };
};
