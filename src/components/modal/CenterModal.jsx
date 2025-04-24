import React from "react";
import Portal from "./Portal";

const CenterModal = ({
  toggleModal,
  children,
  padding = "1rem 2rem",
  borderRadius = "16px",
  bgcolor = "white",
  width = "450px",
  height = "auto",
  justify = "center",
  mainHeight = "100vh", // Changed to full viewport height
  isOpen,
}) => {
  return (
    <Portal>
      <div
        onClick={toggleModal}
        className={`fixed inset-0 z-[100] flex items-center justify-center text-[#4d3127] overflow-auto bg-[rgba(20,23,20,0.5)] backdrop-blur-[6px] p-4 ${
          isOpen ? "visible" : "hidden"
        }`}
        style={{ height: mainHeight }}>
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative overflow-auto cursor-auto mx-auto ${isOpen ? "animate-[scaleUp_0.1s_ease-in-out]" : ""}`}
          style={{
            backgroundColor: bgcolor,
            borderRadius: borderRadius,
            width: width,
            height: height,
            padding: padding,
            maxWidth: "calc(100% - 2rem)", // Ensures it doesn't touch screen edges
          }}>
          {children}
        </div>
      </div>
    </Portal>
  );
};

export default CenterModal;
