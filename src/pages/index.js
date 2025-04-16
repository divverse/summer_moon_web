import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { FaMicrophone, FaStop } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);

  const toggleRecording = () => {
    setIsRecording((prev) => !prev);
    // Simulate recording and transcription for demo
    if (!isRecording) {
      setTranscription("");
      setFeedback("");
      let sample = " Transcribing your voice input...";
      let feedbackSample = " This is the system's feedback.";
      animateText(sample, setTranscription, () => {
        animateText(feedbackSample, setFeedback);
        setHistory((prev) => [sample, ...prev]);
      });
    }
  };

  const animateText = (text, setter, callback) => {
    let i = 0;
    const interval = setInterval(() => {
      setter((prev) => prev + text[i]);
      i++;
      if (i >= text.length - 1) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, 40);
  };

  return (
    <div className={`${geistSans.className} ${geistMono.className} flex min-h-screen text-[#493932] bg-[#efefef]`}>
      {/* Sidebar */}
      <aside className='w-[250px] bg-[#4d3127] text-white p-4 space-y-4 hidden md:block'>
        <h2 className='text-lg font-bold'>Conversation History</h2>
        <ul className='space-y-2'>
          {history.map((item, idx) => (
            <li key={idx} className='text-sm bg-[#af957d] p-2 rounded'>
              {item}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Interface */}
      <main className='flex-1 flex flex-col items-center justify-between p-6 gap-6'>
        <div>
          {" "}
          <header className='w-full text-center text-2xl font-bold'>Summer Moon AI</header>
          <p>Please place your order by starting a recording...</p>
        </div>

        <section className='flex flex-col items-center gap-6 w-full max-w-3xl'>
          {/* Recorder Button */}
          <button
            onClick={toggleRecording}
            className={`text-white p-4 rounded-full hover:bg-[#af957d] transition-all text-2xl ${
              isRecording ? "bg-[#cf161f] text-white" : "bg-[#493932] text-white"
            }`}>
            {isRecording ? <FaStop /> : <FaMicrophone />}
          </button>

          {/* Transcription Display */}
          <div className='w-full bg-white p-4 rounded shadow text-[#4d3127] min-h-[50px] mx-2 h-auto'>
            <p className='whitespace-pre-wrap animate-pulse'>{transcription}</p>
          </div>

          {/* Feedback Display for displaying any information from the backend */}
          {feedback && (
            <div className='w-full bg-[#af957d] p-4 rounded shadow text-white min-h-[80px] mx-2 h-auto'>
              <p className='whitespace-pre-wrap animate-pulse'>{feedback}</p>
            </div>
          )}

          {/* Send Button for backend interaction. Can change to end conversation after hitting send */}
          <button
            onClick={() => {console.log("Send button clicked");}}
            className='bg-[#4d3127] text-white py-2 px-6 rounded hover:bg-[#493932] transition-all'>
            Send
          </button>
        </section>

        <footer className='text-sm text-center text-[#af957d]'>Please end conversation to begin a new order</footer>
      </main>
    </div>
  );
}
