import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { getAttendantResponse } from "@/lib/text-to-speech";

export const useOrderManager = ({ menu, savedSettings, sendOrder, getMenuContext, curateOrder }) => {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [data, setData] = useState({});
  const [audioSrc, setAudioSrc] = useState("");
  const [menuContext, setMenuContext] = useState(null);

  const { is_order_complete, order } = data ?? {};

  const resetOrderState = (errorMessage = "") => {
    setOrderItems([]);
    setStatus(errorMessage ? "idle" : "completed");
    setMessage(errorMessage || "");
    setFeedback("");
    setData({});
    setAudioSrc("");
  };
  const getMenuContextData = useCallback(
    async (text) => {
      await getMenuContext(
        { query: text },
        {
          onSuccess: (data) => {
            setMenuContext(data?.data?.data?.context);
          },
          onError: (error) => {
            console.error("Error getting menu context:", error);
          },
        }
      );
    },
    [text, getMenuContext]
  );

  const getAISpeech = useCallback(
    async (text) => {
      if (!text || !menuContext) return;
      setAudioSrc(null);

      try {
        const responseData = await getAttendantResponse({
          orderTranscript: text,
          chatHistory: history,
          menu: menuContext,
        });

        if (responseData.response === "NO_ORDER_INTENT") return;

        setAudioSrc(responseData.audio);

        if (responseData.response) {
          setHistory((prev) => [
            ...prev,
            { role: "Customer", content: text },
            { role: "AI", content: responseData.response },
          ]);

          setFeedback(responseData.response);
        }
      } catch (error) {
        console.error("AI response error:", error);
        toast.error("Failed to get AI response");
      }
    },
    [menuContext, history]
  );

  useEffect(() => {
    if (text) {
      getMenuContextData(text);
    }
  }, [text, getMenuContextData]);

  useEffect(() => {
    if (menuContext && text) {
      getAISpeech(text);
    }
  }, [menuContext, text, getAISpeech]);

  const trySendOrder = async (text) => {
    if (!text) return;

    setStatus("transcribing");
    setMessage("Curating your order...");
    setFeedback("");

    try {
      // Get menu context first

      // Then curate the order
      const orderResponse = await curateOrder({
        order_transcript: text,
        is_new_order: !data?.order?.id,
        id: data?.order?.id,
      });

      const orderData = orderResponse?.data?.data;
      const selections = orderData?.order?.selections ?? [];
      const isOrderComplete = orderData?.is_order_complete;

      setOrderItems(selections);
      setData(orderData ?? {});
      setStatus("completed");
      setMessage("");

      if (!orderData) {
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
            resetOrderState();
          } catch (error) {
            toast.error(error?.data?.message || "Failed to send order");
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error processing order:", error);
      resetOrderState("Error processing order");
      toast.error("Failed to process your order");
    }
  };

  return {
    status,
    setStatus,
    message,
    setMessage,
    feedback,
    setFeedback,
    history,
    setHistory,
    orderItems,
    setOrderItems,
    data,
    setData,
    audioSrc,
    setAudioSrc,
    menuContext,
    is_order_complete,
    order,
    resetOrderState,
    getAISpeech,
    trySendOrder,
  };
};
