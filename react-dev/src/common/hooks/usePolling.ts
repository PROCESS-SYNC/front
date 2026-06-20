import { useEffect, useRef } from "react";

// ================================
// usePolling 훅
// AI 분석 상태 주기적 조회용
// ================================
export const usePolling = (
  callback: () => void,
  interval: number,
  enabled: boolean,
) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
};
