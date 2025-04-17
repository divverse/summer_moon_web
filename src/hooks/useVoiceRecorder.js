"use client";
import { blobToBase64, createMediaStream } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

export const useRecordVoice = () => {
  const [text, setText] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recording, setRecording] = useState(false);
  const isRecording = useRef(false);
  const chunks = useRef([]);
  const [recordedAudio, setRecordedAudio] = useState(null);


  const startRecording = () => {
    if (mediaRecorder) {
      isRecording.current = true;
      mediaRecorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      isRecording.current = false;
      mediaRecorder.stop();
      setRecording(false);
    }
  };

    const getText = async (audioBlob) => {
      
     try {
      // console.log("Audio blob:", audioBlob);
      // console.log("Audio blob type:", audioBlob.type);
    // console.log("Audio blob size:", audioBlob.size);
      // const formData = new FormData()
      // audio = Buffer.from(audioBlob, "base64");
      // console.log("Audio blob:", audio);
      // formData.append("audio", audioBlob, "audio.wav");
      // for (let [key, value] of formData.entries()) {
      //   console.log(key, value);
      // }
      const response = await fetch("http://localhost:8000/api/v1/orders", {
        method: "POST",
        // headers: {
        //   "Content-Type": "application/json",
        // },
        body: audioBlob
      }).then((res) => res.json());
      const { text } = response;
      setText(text);
    } catch (error) {
      console.log(error);
    }
  };

  const initialMediaRecorder = (stream) => {
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.onstart = () => {
      console.log("Recording started");
      createMediaStream(stream)
      chunks.current = [];
    };

    mediaRecorder.ondataavailable = (ev) => {
      chunks.current.push(ev.data);
    };

    mediaRecorder.onstop = () => {
      console.log("Recording stopped");
      const audioBlob = new Blob(chunks.current, { type: "audio/wav" });
      console.log("Audio blob:", audioBlob);
      blobToBase64(audioBlob, getText);
      // getText(audioBlob);
      setRecordedAudio(audioBlob); // Store the blob in state
    };
 
    setMediaRecorder(mediaRecorder);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(initialMediaRecorder);
    }
  }, []);

  return { recording, startRecording, stopRecording, text, recordedAudio };
};