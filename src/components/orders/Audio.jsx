import { useState, useEffect } from "react";

export default function AudioPlayer({ audioSrc }) {
  const [audioUrl, setAudioUrl] = useState("");

  const base64ToBlobUrl = (base64String, mimeType = "audio/mp3") => {
    // Add padding if needed (Base64 strings should be divisible by 4)
    const paddedBase64 = base64String.padEnd(base64String.length + ((4 - (base64String.length % 4)) % 4), "=");

    // Convert base64 to binary
    const byteCharacters = atob(paddedBase64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return URL.createObjectURL(blob);
  };

  useEffect(() => {
    // Convert when component mounts
    const blobUrl = base64ToBlobUrl(audioSrc);
    setAudioUrl(blobUrl);

    // Clean up
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [audioSrc]);

  return (
    <div>
      {audioUrl ? (
        <audio autoPlay>
          <source src={audioUrl} type='audio/mp3' className='hidden' />
          Your browser does not support the audio element.
        </audio>
      ) : (
        <p>Loading audio...</p>
      )}
    </div>
  );
}
