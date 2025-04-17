import { OpenAI } from "openai";
import { Readable } from "stream";
import FormData from "form-data";
import axios from "axios";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const base64Audio = req.body.audio;

    if (!base64Audio) {
      return res.status(400).json({ error: "No audio data provided" });
    }

    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");

    const audioStream = Readable.from(audioBuffer);

    // Prepare form-data
    const formData = new FormData();
    formData.append("file", audioStream, {
      filename: "audio.webm",
      contentType: "audio/webm",
    });
    formData.append("model", "whisper-1");
    const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    return res.status(200).json({ order_transcript: response.data.text });
  } catch (error) {
    console.error("Error processing audio:", error.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to process audio",
      details: error.response?.data?.error?.message || error.message,
    });
  }
}
