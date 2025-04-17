import { useState, useEffect, useRef } from 'react';

const AudioPlayer = ({ audioBlob }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioBlob) {
      // Create a URL for the blob
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Clean up the URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioBlob]);

  return (
    <div>
      {audioUrl && (
        <audio 
          ref={audioRef}
          src={audioUrl} 
          controls
        />
      )}
    </div>
  );
};

export default AudioPlayer;