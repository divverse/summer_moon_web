import { useCallback, useEffect, useRef, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { FaEdit, FaMicrophone, FaStop } from "react-icons/fa";
import { useRecordVoice } from "@/hooks/useVoiceRecorder";
import { RiDeleteBinLine } from "react-icons/ri";
import CenterModal from "@/components/modal/CenterModal";
import MenuForm from "@/components/MenuForm";
import { IoIosCloseCircle, IoMdClose, IoMdInformationCircle } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { toast } from "react-toastify";
import { useMicVAD } from "@ricky0123/vad-react";
import { blobToBase64, exportWAV } from "@/lib/utils";
import {
  useGetMenu,
  useCurateOrders,
  useGetSettings,
  useUpdateSettings,
  useSendOrders,
  useGetOrders,
  useGetMenuContext,
} from "@/hooks/orders.hook";
import Image from "next/image";
import OrderHistory from "@/components/orders/OrderHistory";
import SettingsPanel from "@/components/orders/SettingsPanel";
import { getAttendantResponse, playAudio } from "@/lib/text-to-speech";
import AudioPlayer from "@/components/orders/Audio";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const {
    startRecording,
    stopRecording,
    recording,
    getText,
    setTranscription,
    transcription,
    text: newText,
  } = useRecordVoice();
  const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'transcribing' | 'completed'
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: menuData, isLoading } = useGetMenu({ search, limit: 10, page });
  const [audioSrc, setAudioSrc] = useState("");
  const { data: settingsData, isLoading: loadingSettings } = useGetSettings();
  const { mutate: updatesettings, isLoading: updatingSettings } = useUpdateSettings();
  const { mutate: getMenuContext, isLoading: gettingMenuContext } = useGetMenuContext();
  const [menuContext, setMenuContext] = useState(null);
  const { mutate, isLoading: curatingOrders } = useCurateOrders();
  const { mutate: sendOrder, isLoading: sendingOrders } = useSendOrders();
  const { data: ordersData, isLoading: loadingOrders } = useGetOrders({
    page: 1,
    limit: 5,
  });
  // console.log({ ordersData });
  const orderHistory = ordersData?.data?.data?.orders || [];
  const menu = menuData?.data?.data || [];
  const savedSettings = settingsData?.data?.data || {
    order: "AUTO",
    recording: "MANUAL",
    speech: true,
  };

  const [message, setMessage] = useState("");
  const [openSettings, setOpenSettings] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [edit, setEdit] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [data, setData] = useState({});
  const { is_order_complete, order, toast_order } = data ?? {};
  console.log({ data });
  const [editForm, setEditForm] = useState({
    item: "",
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    modifiers: [],
  });

  // Timer ref for the 4-second delay
  const curationTimerRef = useRef(null);
  const transcriptionRef = useRef(transcription);

  useEffect(() => {
    transcriptionRef.current = transcription;
    if (savedSettings?.recording === "MANUAL") {
      startCurationTimer();
    }
  }, [transcription]);

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
    startOnLoad: savedSettings?.recording === "VAD",
  });

  // Start the 4-second timer for order curation
  const startCurationTimer = () => {
    // Clear any existing timer
    if (curationTimerRef.current) {
      clearTimeout(curationTimerRef.current);
    }

    // Set new timer
    curationTimerRef.current = setTimeout(async () => {
      // Use the ref to get the latest transcription value
      if (transcriptionRef.current) {
        await curateOrder(transcriptionRef.current);
      }
    }, 4000); // 4 seconds delay
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (curationTimerRef.current) {
        clearTimeout(curationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (savedSettings?.recording === "MANUAL") {
      vad.pause();
    } else {
      vad.start();
    }
  }, [savedSettings?.recording]);
  console.log({ menu });

  useEffect(() => {
    if (recording) {
      setStatus("recording");
      setMessage("Listening...");
      setFeedback("");
    } else if (!recording && data.length === 0 && status === "recording") {
      setStatus("transcribing");
      setMessage("Transcribing your audio...");
    } else if (data.length > 0) {
      setStatus("completed");
      const feedbackMessage = is_order_complete
        ? "Order fetched successfully and will begin transfer to Toast"
        : "Order fetched successfully, please let us know if this is all?";
      setFeedback(feedbackMessage);
      setMessage("");

      // For manual recording, start the curation timer when recording stops and data is available
    }
  }, [recording, orderItems, status]);

  const toggleRecording = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
      setStatus("recording");
    }
  };
  const getMenuContextData = useCallback(
    async (text) => {
      await getMenuContext(
        { query: text },
        {
          onSuccess: (data) => {
            console.log({ contexting: data });
            setMenuContext(data?.data?.data?.context_text);
          },
        }
      );
    },
    [getMenuContext]
  );

  const getAISpeech = useCallback(async () => {
    if (!newText) return;
    setAudioSrc(null);

    try {
      // Get AI response using the utility function
      const responseData = await getAttendantResponse({
        orderTranscript: newText,
        chatHistory: history,
        menu: menuContext,
      });
      setAudioSrc(responseData.audio);

      // Add to chat history first
      if (responseData.response) {
        setHistory((prev) => [
          ...prev,
          { role: "Customer", content: newText },
          { role: "AI", content: responseData.response },
        ]);

        // Set feedback message
        setFeedback(responseData.response);
      }

      // Play audio if available and speech setting is enabled
      if (responseData.audio && savedSettings?.speech) {
        try {
          // Check if browser supports Audio API
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) {
            console.error("Browser does not support Web Audio API");
            return;
          }

          // Create audio context on user interaction
          const audioContext = new AudioContext();

          // Decode and play the audio
          const audioBuffer = await audioContext.decodeAudioData(
            Uint8Array.from(atob(responseData.audio), (buffer) => buffer.charCodeAt(0)).buffer
          );

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();

          // Handle audio context suspension
          const handleUserInteraction = () => {
            if (audioContext.state === "suspended") {
              audioContext.resume();
            }
            document.removeEventListener("click", handleUserInteraction);
          };

          document.addEventListener("click", handleUserInteraction);
        } catch (audioError) {
          console.error("Audio playback error:", audioError);
          toast.error("Failed to play audio response");
        }
      }
    } catch (aiError) {
      console.error("AI response error:", aiError);
    }
  }, [newText, history, menuContext, savedSettings?.speech]);

  // Call getMenuContextData whenever text changes
  useEffect(() => {
    if (newText) {
      getMenuContextData(newText);
    }
  }, [newText, getMenuContextData]);

  // Call getAISpeech whenever menuContext changes
  useEffect(() => {
    if (menuContext) {
      getAISpeech();
    }
  }, [menuContext, getAISpeech]);

  const curateOrder = async (text) => {
    if (!text) return;

    // Set initial state
    setStatus("transcribing");
    setMessage("Curating your order...");
    setFeedback("");

    mutate(
      {
        order_transcript: text,
        is_new_order: !data?.order?.id,
        id: data?.order?.id,
      },
      {
        onSuccess: async (response) => {
          const orderData = response?.data?.data;
          const selections = orderData?.order?.selections ?? [];
          const isOrderComplete = orderData?.is_order_complete;

          // Update state
          setOrderItems(selections);
          setData(orderData ?? {});
          setStatus("completed");
          setMessage("");
          console.log({ orderData, history });

          if (!orderData) {
            // Set appropriate feedback message
            setFeedback(
              selections.length > 0
                ? isOrderComplete
                  ? "Order fetched successfully and will begin transfer to Toast"
                  : "Order fetched successfully, please let us know if this is all?"
                : "Please go ahead to make your order"
            );
          }

          // Auto-send to Toast if conditions are met
          if (savedSettings.order === "AUTO" && isOrderComplete) {
            setTimeout(async () => {
              try {
                const sendResponse = await sendOrder({
                  order: { selections },
                });

                toast.success(sendResponse?.data?.message || "Order sent successfully");
                setAudioSrc(null);
                setHistory([]);
                setFeedback("");
                setMessage("");
                setTranscription("");
                resetOrderState();
              } catch (error) {
                toast.error(error?.data?.message || "Failed to send order");
              }
            }, 3000); // 3-second delay
          }
        },
        onError: (error) => {
          console.error("Error processing order:", error);
          resetOrderState("Error processing order");
          toast.error("Failed to process your order");
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

  const clearForm = () => {
    setEditForm({
      item: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      modifiers: [],
    });
  };

  // Updated handleEditChange and handleEditSubmit functions
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "item") {
      let selectedItem = null;
      for (const group of menu) {
        const foundItem = group.items?.find((item) => item.guid === value);
        if (foundItem) {
          selectedItem = foundItem;
          break;
        }
      }
      const newQuantity = editForm.quantity || 1;
      const newUnitPrice = selectedItem?.price || 0;

      setEditForm({
        ...editForm,
        [name]: value,
        unit_price: newUnitPrice,
        total_price: newQuantity * newUnitPrice,
      });
    } else if (name === "quantity") {
      const quantity = parseInt(value) || 1;
      setEditForm({
        ...editForm,
        [name]: quantity,
        total_price: quantity * editForm.unit_price,
      });
    }
  };

  const handleEditSubmit = (updatedItem) => {
    if (edit) {
      setOrderItems((prevItems) => prevItems.map((item) => (item.guid === updatedItem.guid ? updatedItem : item)));
    } else {
      const itemExists = orderItems.some(
        (prevItem) =>
          prevItem.guid === updatedItem.guid &&
          JSON.stringify(prevItem.modifiers) === JSON.stringify(updatedItem.modifiers)
      );

      if (itemExists) {
        toast.error("Item already exists in the order list, edit instead.");
      } else {
        setOrderItems([...orderItems, updatedItem]);
      }
    }
    clearForm();
    setEdit(false);
    setOpenEdit(false);
  };

  const handleDeleteItem = (guid, modifiers = []) => {
    setOrderItems((prevItems) =>
      prevItems.filter((item) => {
        // If no modifiers specified, delete all items with this GUID
        if (!modifiers || modifiers.length === 0) {
          return item.guid !== guid;
        }

        // If modifiers are specified, only delete if both GUID and modifiers match
        return !(item.guid === guid && JSON.stringify(item.modifiers) === JSON.stringify(modifiers));
      })
    );
  };

  const handleSubmitOrder = () => {
    const orderWithModifiers = {
      selections: orderItems.map((item) => ({
        ...item,
        modifiers: item.modifiers || [],
      })),
    };
    sendOrder(
      {
        order: orderWithModifiers,
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
  };

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen text-[#493932] bg-[#efefef]`}>
      {/* Sidebar */}
      {/* <aside className='w-[250px] bg-[#4d3127] text-white p-4 space-y-4 hidden md:block'>
        <h2 className='text-lg font-bold'>Conversation History</h2>
        <ul className='space-y-2'>
          {orderHistory.map((item, idx) => (
            <li key={idx} className='text-sm bg-[#af957d] p-2 rounded cursor-pointer'>
              <div className='truncate text-[#4d3127] font-bold'>{item.transcript}</div>
              <small className='text-[#8d3b1f]'>
                {new Date(item.created_at).toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </small>
            </li>
          ))}
        </ul>
      </aside> */}
      <OrderHistory />

      {/* Main Interface */}
      <main className='flex-1 flex flex-col items-center justify-between p-6 gap-6'>
        <div className='w-full'>
          <div className='text-center'>
            <header className='w-full text-2xl font-bold'>Summer Moon AI</header>
            <p>Please place your order by starting a recording...</p>
          </div>
          <div className='ml-auto relative w-fit mt-[-50px] cursor-pointer'>
            <IoSettings size={30} onClick={() => setOpenSettings((s) => !s)} />
            {openSettings && <SettingsPanel savedSettings={savedSettings} updatesettings={updatesettings} />}
          </div>
        </div>

        <section className='flex flex-col items-center gap-6 w-full max-w-3xl'>
          {/* Recorder Button */}
          {savedSettings?.recording === "VAD" ? (
            <div>
              {vad.userSpeaking ? (
                <Image src='/voice-detector.svg' alt='Mic On' width={70} height={50} />
              ) : (
                <Image src='/voce-detector.svg' alt='Mic Off' width={70} height={50} />
              )}
            </div>
          ) : (
            <button
              onClick={toggleRecording}
              className={`text-white p-4 rounded-full hover:bg-[#af957d] transition-all text-2xl ${
                recording ? "bg-[#cf161f] text-white" : "bg-[#493932] text-white"
              }`}
              aria-label={recording ? "Stop recording" : "Start recording"}>
              {recording ? <FaStop /> : <FaMicrophone />}
            </button>
          )}

          {(feedback || message) && (
            <div className='w-full bg-[#af957d] p-4 rounded shadow text-white min-h-[60px] mx-2 h-auto'>
              {message && <p className='whitespace-pre-wrap'>{message}</p>}
              {feedback && <p className='whitespace-pre-wrap'>{feedback}</p>}
              {audioSrc && <AudioPlayer audioSrc={audioSrc} />}
            </div>
          )}

          {/* Status Messages */}
          <div className='w-full bg-white p-4 rounded shadow min-h-[50px] mx-2 h-auto'>
            <p className='whitespace-pre-wrap animate-pulse text-[#21140f] '>{transcription}</p>
          </div>

          {/* Order Table */}
          {orderItems.length > 0 && (
            <>
              <div className='w-full bg-white p-4 rounded-lg shadow-md mt-4'>
                <div className='flex items-center justify-between w-full mb-3'>
                  <h3 className='text-lg font-semibold'>Order Items</h3>
                  {savedSettings?.order !== "AUTO" && (
                    <button
                      onClick={() => setOpenEdit(true)}
                      className='px-4 py-2 text-sm font-medium text-white bg-[#4d3127] rounded-md hover:bg-[#493932]'>
                      Add new Item
                    </button>
                  )}
                </div>
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Item Name
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Quantity
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Unit Price
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Total Price
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {orderItems.map((item) => (
                        <tr key={item.guid + (JSON.stringify(item.modifiers) || "")}>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {item.name || "Unnamed Item"}
                            {item.modifiers?.length > 0 && (
                              <div className='text-xs text-gray-500 mt-1'>
                                {item.modifiers.map((m) => m.name).join(", ")}
                              </div>
                            )}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.quantity || 1}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            ${item.unit_price?.toFixed(2) || "0.00"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            ${item.total_price?.toFixed(2) || "0.00"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {savedSettings?.order !== "AUTO" && (
                              <div className='flex items-center gap-3'>
                                <button
                                  onClick={() => {
                                    setEditForm({
                                      item: item.guid,
                                      quantity: item.quantity,
                                      unit_price: item.unit_price,
                                      total_price: item.total_price,
                                      modifiers: item.modifiers || [],
                                    });
                                    setOpenEdit(true);
                                    setEdit(true);
                                  }}
                                  aria-label='Edit item'>
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.guid, item.modifiers)}
                                  aria-label='Delete item'>
                                  <RiDeleteBinLine color={"red"} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan='4' className='px-6 py-4 text-sm font-medium text-gray-900'>
                          Total
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          ${order?.total_price?.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Send Button */}
          {savedSettings?.order !== "AUTO" && (
            <button
              onClick={handleSubmitOrder}
              disabled={status !== "completed"}
              className={`bg-[#4d3127] text-white py-2 px-6 rounded transition-all ${
                status !== "completed" ? "opacity-50 cursor-not-allowed" : "hover:bg-[#493932]"
              }`}>
              Send Order
            </button>
          )}
        </section>

        <footer className='text-sm text-center text-[#af957d]'>
          {status === "completed" ? "Please end conversation to begin a new order" : "Ready to take your order"}
        </footer>
      </main>

      {/* Edit Modal */}
      {openEdit && (
        <CenterModal width={"500px"} isOpen={openEdit} toggleModal={() => setOpenEdit(false)}>
          <MenuForm
            handleEditChange={handleEditChange}
            handleEditSubmit={handleEditSubmit}
            edit={edit}
            editForm={editForm}
            allMenu={menu}
            onClose={() => {
              setOpenEdit(false);
              setEdit(false);
              clearForm();
            }}
          />
        </CenterModal>
      )}
    </div>
  );
}
