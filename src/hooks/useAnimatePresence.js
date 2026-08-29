import { useState, useEffect } from "react";

/**
 * Custom hook to allow exit CSS animations before unmounting React components.
 * @param {boolean} isOpen - Current open/visible state
 * @param {number} duration - Animation duration in ms (default: 180ms)
 */
export function useAnimatePresence(isOpen, duration = 180) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, shouldRender]);

  return { shouldRender, isClosing };
}
