
import { component$, Slot, useContextProvider } from "@builder.io/qwik";
import { useUserStore, UserContext } from "../../store/user.store";

export const UserProvider = component$(() => {
    const userStore = useUserStore();
    
    // Provide user context to all children
    useContextProvider(UserContext, userStore);
    
    return <Slot />;
});