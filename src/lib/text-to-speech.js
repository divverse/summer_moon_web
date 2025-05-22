/**
 * Calls the text-to-speech API to get an AI attendant response
 * @param {Object} params - The parameters for the text-to-speech API
 * @param {string} params.orderTranscript - The customer's order transcript
 * @param {Array} params.chatHistory - The history of the conversation
 * @param {Array} params.menu - The menu items
 * @returns {Promise<Object>} - The response from the API
 */
export const getAttendantResponse = async ({ orderTranscript, chatHistory, menu }) => {
  try {
    const response = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderTranscript,
        chatHistory,
        menu: typeof menu === "string" ? menu : JSON.stringify(menu),
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling text-to-speech API:", error);
    throw error;
  }
};

/**
 * Plays audio from a base64 string
 * @param {string} base64Audio - The audio data as a base64 string
 * @returns {Promise<void>}
 */
export const playAudio = async (audioData) => {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Decode the base64 audio data
    const audioBuffer = await audioContext.decodeAudioData(
      Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0)).buffer
    );

    // Create and play the audio
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    return new Promise((resolve) => {
      source.onended = resolve;
    });
  } catch (error) {
    console.error("Audio playback error:", error);
    throw error;
  }
};
