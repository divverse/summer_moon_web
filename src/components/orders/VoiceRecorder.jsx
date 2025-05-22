import { useRef, useEffect } from 'react';
import { useMicVAD } from "@ricky0123/vad-react";
import { useRecordVoice } from "@/hooks/useVoiceRecorder";
import { blobToBase64, exportWAV } from "@/lib/utils";

export const useVoiceRecording = () => {
  const { startRecording, stopRecording, recording, getText, setTranscription, transcription } = useRecordVoice();
  const transcriptionRef = useRef(transcription);
  const curationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const vad = useMicVAD({
    onSpeechEnd: async (audio) => {
      console.log("User stopped talking");
      setMessage("Transcribing your audio...");
      const audioBlob = exportWAV(audio, 16000);
      blobToBase64(audioBlob, getText);
      // console.log({ transcription });
      // Start the 4-second timer when speech ends
      startCurationTimer();
    },
    onSpeechStart: () => {
      console.log("User started talking");
      setMessage("Listening...");
      // Clear the timer if speech starts again
      if (curationTimerRef.current) {
        clearTimeout(curationTimerRef.current);
        curationTimerRef.current = null;
      }
    },
    startOnLoad: savedSettings?.recording === "MANUAL" ? false : true,
  });

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
      setStatus("recording");
    }
  };

  useEffect(() => {
    transcriptionRef.current = transcription;
  }, [transcription]);
  const curateOrder = (text) => {
    if (!text) return;

    setStatus("transcribing");
    setMessage("Curating your order...");
    setFeedback("");

    mutate(
      {
        order_transcript: text,
        is_new_order: true,
      },
      {
        onSuccess: (data) => {
          const orderData = data?.data?.data;
          const selections = orderData?.order?.selections ?? [];
          const isOrderComplete = orderData?.is_order_complete;

          setOrderItems(selections);
          setData(orderData ?? {});
          setStatus("completed");
          setMessage("");

          // Determine feedback message
          let feedbackMessage = "Please go ahead to make your order";
          if (selections.length > 0) {
            feedbackMessage = isOrderComplete
              ? "Order fetched successfully and will begin transfer to Toast"
              : "Order fetched successfully, please let us know if this is all?";
          }
          setFeedback(feedbackMessage);

          // Auto-send to Toast if conditions are met
          if (savedSettings.order === "AUTO" && isOrderComplete) {
            setTimeout(() => {
              sendOrder(
                {
                  order: { selections },
                },
                {
                  onSuccess: (response) => {
                    toast.success(response?.data?.message || "Order sent successfully");
                    resetOrderState();
                  },
                  onError: (error) => {
                    toast.error(error?.data?.message || "Failed to send order");
                  },
                }
              );
            }, 3000); // 3-second delay
          }
        },
        onError: (error) => {
          console.error("Error in mutate:", error);
          resetOrderState("Error processing order");
        },
      }
    );
  };

  const resetOrderState = (errorMessage = "") => {
    setOrderItems([]);
    setStatus(errorMessage ? "idle" : "completed");
    setMessage(errorMessage || "");
    setFeedback("");
    if (!errorMessage) {
      setTranscription("");
    }
  };

  return {
    recording,
    toggleRecording,
    vad,
    // ... other needed values
  };
};