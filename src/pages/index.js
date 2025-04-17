import { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { useRecordVoice } from "@/hooks/useVoiceRecorder";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { startRecording, stopRecording, data, recording, setData } = useRecordVoice();
  const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'transcribing' | 'completed'
  const [transcription, setTranscription] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);

  const testData = [
    {
      name: "Coffee",
      quantity: 1,
      guid: "365e5992-e66a-4f04-a38b-133cbb02f5b4",
    },
    {
      name: "Lemonade",
      quantity: 1,
      guid: "43eacb26-8f7e-46db-a4b3-689108015490",
    },
  ];

  useEffect(() => {
    if (recording) {
      setStatus("recording");
      setTranscription("Listening...");
      setFeedback("");
    } else if (!recording && data.length === 0 && status === "recording") {
      setStatus("transcribing");
      setTranscription("Transcribing your audio...");
    } else if (data.length > 0) {
      setStatus("completed");
      setFeedback("Order fetched successfully!");
      setTranscription("");
    }
  }, [recording, data, status]);

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
      setStatus("recording");
      setData([]); // Reset data when starting new recording
    }
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
          <header className='w-full text-center text-2xl font-bold'>Summer Moon AI</header>
          <p>Please place your order by starting a recording...</p>
        </div>

        <section className='flex flex-col items-center gap-6 w-full max-w-3xl'>
          {/* Recorder Button */}
          <button
            onClick={toggleRecording}
            className={`text-white p-4 rounded-full hover:bg-[#af957d] transition-all text-2xl ${
              recording ? "bg-[#cf161f] text-white" : "bg-[#493932] text-white"
            }`}>
            {recording ? <FaStop /> : <FaMicrophone />}
          </button>

          {/* Status Messages */}

          <div className='w-full bg-white p-4 rounded shadow text-[#4d3127] min-h-[50px] mx-2 h-auto'>
            <p className='whitespace-pre-wrap animate-pulse'>{transcription}</p>
          </div>

          {/* Order Table */}
          { testData.length > 0 && (
            <>
              <div className='w-full bg-white p-4 rounded-lg shadow-md mt-4'>
                <h3 className='text-lg font-semibold mb-3 text-gray-800'>Order Items</h3>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Item Name
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Quantity
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {testData.map((item, index) => (
                      <tr key={index}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {item.name || "Unnamed Item"}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.quantity || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* <div className='w-full bg-[#af957d] p-4 rounded shadow text-white min-h-[80px] mx-2 h-auto mt-4'>
                <p className='whitespace-pre-wrap animate-pulse'>{feedback}</p>
              </div> */}
            </>
          )}

          {/* Send Button */}
          <button
            onClick={() => {
              console.log("Order submitted:", data);
              setHistory((prev) => [...prev, `Order placed with ${data.length} items`]);
              setStatus("idle");
              setData([]);
            }}
            disabled={status !== "completed"}
            className={`bg-[#4d3127] text-white py-2 px-6 rounded transition-all ${
              status !== "completed" ? "opacity-50 cursor-not-allowed" : "hover:bg-[#493932]"
            }`}>
            Send Order
          </button>
        </section>

        <footer className='text-sm text-center text-[#af957d]'>
          {status === "completed" ? "Please end conversation to begin a new order" : "Ready to take your order"}
        </footer>
      </main>
    </div>
  );
}
