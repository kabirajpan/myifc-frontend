
import { component$, Slot, useContextProvider } from "@builder.io/qwik";
import { useChatStore, ChatContext } from "../../store/chat.store";

export const ChatProvider = component$(() => {
    const chatStore = useChatStore();
    
    // Provide chat context to all children
    useContextProvider(ChatContext, chatStore);
    
    return <Slot />;
});