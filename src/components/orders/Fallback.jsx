import { useEffect, useRef, useState } from "react";
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
import { useGetMenu, useCurateOrders, useGetSettings, useUpdateSettings, useSendOrders } from "@/hooks/orders.hook";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { startRecording, stopRecording, recording, getText, setTranscription, transcription } = useRecordVoice();
  const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'transcribing' | 'completed'
  const { data: menuData, isLoading } = useGetMenu();
  const { data: settingsData, isLoading: loadingSettings } = useGetSettings();
  const { mutate: updatesettings, isLoading: updatingSettings } = useUpdateSettings();
  const { mutate, isLoading: curatingOrders } = useCurateOrders();
  const { mutate: sendOrder, isLoading: sendingOrders } = useSendOrders();
  const menu = menuData?.data?.data || [];
  const savedSettings = settingsData?.data?.data || [];

  const [message, setMessage] = useState("");
  const [openSettings, setOpenSettings] = useState(false);
  console.log({ savedSettings });
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
    size: null,
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
    startOnLoad: savedSettings?.recording === "MANUAL" ? false : true,
  });

  // Start the 4-second timer for order curation
  const startCurationTimer = () => {
    // Clear any existing timer
    if (curationTimerRef.current) {
      clearTimeout(curationTimerRef.current);
    }

    // Set new timer
    curationTimerRef.current = setTimeout(() => {
      // Use the ref to get the latest transcription value
      if (transcriptionRef.current) {
        curateOrder(transcriptionRef.current);
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
  }, [savedSettings]);
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

  const clearForm = () => {
    setEditForm({
      item: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      size: null,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "item") {
      const selectedItem = allMenu.find((item) => item.guid === value);
      const newQuantity = editForm.quantity || 1;
      const newUnitPrice = selectedItem?.unit_price || 0;

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
    } else if (name === "size") {
      setEditForm({
        ...editForm,
        [name]: value,
      });
    }
  };

  const handleEditSubmit = () => {
    const selectedItem = allMenu.find((item) => item.guid === editForm.item);
    if (!selectedItem) return;

    const updatedItem = {
      ...editForm,
      name: selectedItem.name,
      guid: editForm.item,
      size: editForm.size || null,
      quantity: editForm.quantity,
      unit_price: selectedItem.unit_price,
      total_price: editForm.quantity * selectedItem.unit_price,
    };

    if (edit) {
      setOrderItems((prevItems) => prevItems.map((item) => (item.guid === editForm.item ? updatedItem : item)));
    } else {
      const itemExists = orderItems.some(
        (prevItem) => prevItem.guid === updatedItem.guid && prevItem.size === updatedItem.size
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

  const handleDeleteItem = (guid) => {
    setOrderItems((prevItems) => prevItems.filter((item) => item.guid !== guid));
  };

  const handleSubmitOrder = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order: {
            selections: orderItems,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(`${errorText}`);
        throw new Error(`API Error: ${errorText}`);
      }

      const data = await response.json();
      if (data) {
        toast.success("Order placed successfully!");
      }
    } catch (error) {
      console.error("Error in getText:", error);
    }
    setHistory((prev) => [...prev, `Order placed with ${orderItems.length} items`]);
    setStatus("idle");
    setData([]);
  };

  return (
    <div className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen text-[#493932] bg-[#efefef]`}>
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
        <div className='w-full'>
          <div className='text-center'>
            <header className='w-full text-2xl font-bold'>Summer Moon AI</header>
            <p>Please place your order by starting a recording...</p>
          </div>
          <div className='ml-auto relative w-fit mt-[-50px] cursor-pointer'>
            <IoSettings size={30} onClick={() => setOpenSettings((s) => !s)} />
            {openSettings && (
              <div className='absolute right-0 top-[3rem] bg-white shadow-lg rounded p-4 w-[250px]'>
                <h3 className='text-sm font-semibold'>Settings</h3>
                <div className='flex items-center gap-2 mt-2'>
                  <input
                    type='checkbox'
                    id='auto'
                    value={savedSettings.recording ?? "VAD"}
                    checked={savedSettings.recording === "VAD"}
                    onChange={() => {
                      const newRecording = savedSettings.recording === "MANUAL" ? "VAD" : "MANUAL";
                      const settings = { ...savedSettings, recording: newRecording };
                      updatesettings(settings, {
                        onSuccess: () => {
                          toast.info("Audio options changed");
                        },
                        onError: () => {
                          toast.error("Something went wrong");
                        },
                      });
                    }}
                  />
                  <label htmlFor='auto' className='text-xs font-medium'>
                    Automatic Voice Detection
                  </label>
                </div>
                <div className='flex items-center gap-2 mt-2'>
                  <input
                    type='checkbox'
                    id='auto'
                    value={savedSettings.order ?? "AUTO"}
                    checked={savedSettings.order === "AUTO"}
                    onChange={() => {
                      const newOrder = savedSettings.order === "MANUAL" ? "AUTO" : "MANUAL";
                      const settings = { ...savedSettings, order: newOrder };
                      updatesettings(settings, {
                        onSuccess: () => {
                          toast.info("Order options changed");
                        },
                        onError: () => {
                          toast.error("Something went wrong");
                        },
                      });
                    }}
                  />
                  <label htmlFor='auto' className='text-xs font-medium'>
                    Automatic Order
                  </label>
                </div>
              </div>
            )}
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
                          Mod
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
                        <tr key={item.guid + (item.size || "")}>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {item.name || "Unnamed Item"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.quantity || 1}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {item.modifiers?.[0]?.name || "N/A"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            $
                            {item.unit_price
                              ? item.unit_price?.toFixed(2)
                              : item?.modifiers[0]?.unit_price?.toFixed(2) || "0.00"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            ${item.total_price?.toFixed(2) || "0.00"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            <div className='flex items-center gap-3'>
                              <button
                                disabled={savedSettings?.order === "AUTO"}
                                onClick={() => {
                                  setEditForm({
                                    item: item.guid,
                                    quantity: item.quantity,
                                    unit_price: item.unit_price,
                                    total_price: item.total_price,
                                    size: item.size || null,
                                  });
                                  setOpenEdit(true);
                                  setEdit(true);
                                }}
                                aria-label='Edit item'>
                                <FaEdit className={savedSettings?.order === "AUTO" && "opacity-20"} />
                              </button>
                              <button
                                disabled={savedSettings?.order === "AUTO"}
                                onClick={() => handleDeleteItem(item.guid)}
                                aria-label='Delete item'>
                                <RiDeleteBinLine
                                  color={"red"}
                                  className={savedSettings?.order === "AUTO" && "opacity-20"}
                                />
                              </button>
                            </div>
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
