import { useSignal } from "@builder.io/qwik";

/**
 * Custom hook to manage unified sidebar state
 * Returns ONLY signals - no functions to avoid serialization issues
 */
export const useUnifiedSidebar = () => {
  // State signals
  const isOpen = useSignal(false);
  const rooms = useSignal([]);
  const chats = useSignal([]);

  return {
    isOpen,
    rooms,
    chats,
  };
};