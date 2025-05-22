import { useState } from "react";
import { useGetMenu, useCurateOrders, useGetSettings, useUpdateSettings, useSendOrders } from "@/hooks/orders.hook";
import { toast } from "react-toastify";

export const useOrderManagement = () => {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [data, setData] = useState({});

  const { data: menuData } = useGetMenu();
  const { data: settingsData } = useGetSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { mutate: curateOrder } = useCurateOrders();
  const { mutate: sendOrder } = useSendOrders();

  const menu = menuData?.data?.data || [];
  const savedSettings = settingsData?.data?.data || [];
  const { is_order_complete, order } = data ?? {};

  const handleSubmitOrder = () => {
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

  return {
    orderItems,
    status,
    message,
    feedback,
    history,
    savedSettings,
    handleSubmitOrder,
    resetOrderState,
    // ... other needed values
  };
};
