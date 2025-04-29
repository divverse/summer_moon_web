import { useEffect, useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { FaEdit, FaMicrophone, FaStop } from "react-icons/fa";
import { useRecordVoice } from "@/hooks/useVoiceRecorder";
import { RiDeleteBinLine } from "react-icons/ri";
import CenterModal from "@/components/modal/CenterModal";
import MenuForm from "@/components/MenuForm";
import { IoIosCloseCircle, IoMdClose, IoMdInformationCircle } from "react-icons/io";
import { toast } from "react-toastify";
import { useMicVAD } from "@ricky0123/vad-react";
import { blobToBase64, exportWAV } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const { startRecording, stopRecording, data, recording, setData, getText, text, setText } = useRecordVoice();
  const [status, setStatus] = useState("idle"); // 'idle' | 'recording' | 'transcribing' | 'completed'
  const [transcription, setTranscription] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [edit, setEdit] = useState(false);
  const [allMenu, setAllMenu] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);
  const [orderItems, setOrderItems] = useState(data);
  const [editForm, setEditForm] = useState({
    item: "",
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    size: null,
  });

  const getMenu =  async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/menu");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${errorText}`);
      }
      const data = await response.json();
      setAllMenu(data?.data?.menu);
    } catch (error) {
      console.error("Error in getText:", error);
    }
  }

  const vad = useMicVAD({
    onSpeechEnd: async (audio) => {
      console.log("User stopped talking");
      const audioBlob = exportWAV(audio, 16000);
      blobToBase64(audioBlob, getText);
    },
    onSpeechStart: (audio) => {
      console.log("User started talking");
    },
  });


  useEffect(() => {
    getMenu();
  }
  , []);
  console.log({ allMenu });
  useEffect(() => {
    setOrderItems(data);
  }
  , [data]);
  console.log({ data });

  // const [orderItems, setOrderItems] = useState([
  //   {
  //     name: "Lemonade",
  //     quantity: 2,
  //     guid: "43eacb26-8f7e-46db-a4b3-689108015490",
  //     size: "Small",
  //     unit_price: 2,
  //     total_price: 4,
  //   },
  //   {
  //     name: "Tea",
  //     quantity: 2,
  //     guid: "9e2fef30-1d09-4ef3-a87e-a03bee94b014",
  //     unit_price: 1.5,
  //     total_price: 3,
  //   },
  //   {
  //     name: "Coffee",
  //     quantity: 1,
  //     guid: "365e5992-e66a-4f04-a38b-133cbb02f5b4",
  //     unit_price: 1.5,
  //     total_price: 1.5,
  //   },
  // ]);
  

  // const allMenu = [
  //   {
  //     name: "Coffee",
  //     guid: "365e5992-e66a-4f04-a38b-133cbb02f5b4",
  //     unit_price: 1.5,
  //   },
  //   {
  //     name: "Tea",
  //     guid: "9e2fef30-1d09-4ef3-a87e-a03bee94b014",
  //     unit_price: 1.2,
  //   },
  //   {
  //     name: "Lemonade",
  //     guid: "43eacb26-8f7e-46db-a4b3-689108015490",
  //     unit_price: 1.3,
  //   },
  // ];

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

  // useEffect(() => {
  //   if (editItem) {
  //     const selectedItem = allMenu.find((item) => item.guid === editItem.guid);
  //     setEditForm({
  //       item: editItem.guid,
  //       quantity: editItem.quantity,
  //       size: editItem.size,
  //       unit_price: selectedItem?.unit_price || editItem.unit_price,
  //       total_price: editItem.quantity * (selectedItem?.unit_price || editItem.unit_price),
  //     });
  //   }
  // }, [editItem]);

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
    console.log({ selectedItem });
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
      console.log({ itemExists, orderItems, updatedItem });
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
    console.log("Order submitted:", orderItems);
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
      console.log({ data });
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
        <div className='text-center'>
          <header className='w-full text-2xl font-bold'>Summer Moon AI</header>
          <p>Please place your order by starting a recording...</p>
        </div>

        <section className='flex flex-col items-center gap-6 w-full max-w-3xl'>
          {/* Recorder Button */}
          <button
            onClick={toggleRecording}
            className={`text-white p-4 rounded-full hover:bg-[#af957d] transition-all text-2xl ${
              recording ? "bg-[#cf161f] text-white" : "bg-[#493932] text-white"
            }`}
            aria-label={recording ? "Stop recording" : "Start recording"}>
            {recording ? <FaStop /> : <FaMicrophone />}
          </button>

          {/* Status Messages */}
          <div className='w-full bg-white p-4 rounded shadow text-[#4d3127] min-h-[50px] mx-2 h-auto'>
            <p className='whitespace-pre-wrap animate-pulse'>{transcription}</p>
          </div>

          {/* Order Table */}
          {orderItems.length > 0 && (
            <>
              <div className='w-full bg-white p-4 rounded-lg shadow-md mt-4'>
                <div className='flex items-center justify-between w-full mb-3'>
                  <h3 className='text-lg font-semibold'>Order Items</h3>
                  <button
                    onClick={() => setOpenEdit(true)}
                    className='px-4 py-2 text-sm font-medium text-white bg-[#4d3127] rounded-md hover:bg-[#493932]'>
                    Add new Item
                  </button>
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
                          Size
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
                        <tr key={item.guid + item.size}>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                            {item.name || "Unnamed Item"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.quantity || 1}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{item.size || "N/A"}</td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            ${item.unit_price?.toFixed(2) || "0.00"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            ${item.total_price?.toFixed(2) || "0.00"}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            <div className='flex items-center gap-3'>
                              <button
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
                                <FaEdit />
                              </button>
                              <button onClick={() => handleDeleteItem(item.guid)} aria-label='Delete item'>
                                <RiDeleteBinLine color={"red"} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {feedback && (
                <div className='w-full bg-[#af957d] p-4 rounded shadow text-white min-h-[80px] mx-2 h-auto'>
                  <p className='whitespace-pre-wrap'>{feedback}</p>
                </div>
              )}
            </>
          )}

          {/* Send Button */}
          <button
            onClick={handleSubmitOrder}
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

      {/* Edit Modal */}
      {openEdit && (
        <CenterModal width={"500px"} isOpen={openEdit} toggleModal={() => setOpenEdit(false)}>
          <MenuForm
            handleEditChange={handleEditChange}
            handleEditSubmit={handleEditSubmit}
            edit={edit}
            editForm={editForm}
            allMenu={allMenu}
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
