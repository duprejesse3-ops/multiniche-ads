import { useEffect } from "react";
import { useDesk } from "./store";

export function useExchangeTicker() {
  const open = useDesk((s) => s.exchangeOpen);
  const hydrated = useDesk((s) => s.hydrated);
  const pump = useDesk((s) => s.pump);

  useEffect(() => {
    if (!open || !hydrated) return;
    const id = window.setInterval(() => {
      void pump(1);
    }, 2500);
    return () => window.clearInterval(id);
  }, [open, hydrated, pump]);
}
