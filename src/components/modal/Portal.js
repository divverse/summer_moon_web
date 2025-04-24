import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [portalElement, setPortalElement] = useState(null);

  useEffect(() => {
    setMounted(true);

    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      let element = document.getElementById("portal");

      // Create portal element if it doesn't exist
      if (!element) {
        element = document.createElement("div");
        element.id = "portal";
        document.body.appendChild(element);
      }

      setPortalElement(element);
    }

    return () => {
      // Clean up only if we created the element
      if (portalElement && !document.getElementById("portal")) {
        document.body.removeChild(portalElement);
      }
      setMounted(false);
    };
  }, []);

  if (!mounted || !portalElement) return null;

  return createPortal(children, portalElement);
};

export default Portal;
