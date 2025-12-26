import { component$ } from "@builder.io/qwik";

export const RoomsLayout = component$(({ 
  children,
  showRoomList = true 
}) => {
  console.log('🏠 RoomsLayout rendered');
  return (
    <div class="fixed inset-0 top-16 flex flex-col sm:flex-row sm:gap-3 sm:p-3 bg-gray-50 sm:bg-transparent">
      {children}
    </div>
  );
});

export const RoomsSidebarContainer = component$(({ 
  children,
  showRoomList = true 
}) => {
  console.log('📂 RoomsSidebarContainer rendered, showRoomList:', showRoomList);
  return (
    <div class={`${showRoomList ? "flex" : "hidden"} sm:flex w-full sm:w-72 lg:w-80 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
      {children}
    </div>
  );
});

export const RoomsChatContainer = component$(({ 
  children,
  showRoomList = true 
}) => {
  console.log('💬 RoomsChatContainer rendered, showRoomList:', showRoomList);
  return (
    <div class={`${!showRoomList ? "flex" : "hidden"} sm:flex flex-1 bg-white sm:border sm:border-gray-200 sm:rounded-lg flex-col overflow-hidden h-full`}>
      {children}
    </div>
  );
});