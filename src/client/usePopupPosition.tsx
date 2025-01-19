import { useState, useEffect } from "react";

const usePopupPosition = () => {
  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
    visible: false,
  });

  const handlePopupPosition = () => {
    const globalSelection = window.getSelection();

    if (globalSelection && globalSelection.rangeCount > 0) {
      const range = globalSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      console.log(range, rect, window.screenY);

      if (rect) {
        const top = rect.top + rect.bottom - rect.y;
        const left = rect.left + window.scrollX;

        setPopupPosition({ top, left, visible: true });
      }
    } else {
      setPopupPosition({ top: 0, left: 0, visible: false });
    }
  };

  // Handle page scrolling
  useEffect(() => {
    window.addEventListener("scroll", handlePopupPosition);
    return () => {
      window.removeEventListener("scroll", handlePopupPosition);
    };
  }, []);

  return { popupPosition, handlePopupPosition };
};

export default usePopupPosition;
