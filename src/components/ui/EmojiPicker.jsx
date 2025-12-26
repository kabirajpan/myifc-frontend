import { component$, useSignal, $, useOnDocument } from "@builder.io/qwik";

export const EmojiPicker = component$(({ onEmojiSelect, onClose, show }) => {
  const pickerRef = useSignal();

  // Emoji categories with commonly used emojis
  const emojiCategories = [
    {
      name: "Smileys",
      emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏"]
    },
    {
      name: "Gestures",
      emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "💪", "🙏", "✍️", "💅", "🤳"]
    },
    {
      name: "Emotions",
      emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️"]
    },
    {
      name: "Objects",
      emojis: ["🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🎄", "🎃", "🎇", "🎆", "🧨", "✨", "🎋", "🎍", "🎎", "🎏", "🎐", "🎑", "🧧", "🎗️", "🎟️", "🎫", "🎖️", "🏆"]
    },
    {
      name: "Nature",
      emojis: ["🌸", "💮", "🏵️", "🌹", "🥀", "🌺", "🌻", "🌼", "🌷", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🌍", "🌎", "🌏"]
    },
    {
      name: "Food",
      emojis: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🧇", "🥞", "🧈", "🍞", "🥐", "🥨", "🥯", "🥖", "🧀", "🥗", "🥙", "🥪", "🌮", "🌯", "🫔"]
    }
  ];

  const activeCategory = useSignal(0);

  // Handle click outside to close
  useOnDocument(
    "click",
    $((event) => {
      if (show && pickerRef.value && !pickerRef.value.contains(event.target)) {
        onClose();
      }
    })
  );

  const handleEmojiClick = $((emoji) => {
    onEmojiSelect(emoji);
  });

  if (!show) return null;

  return (
    <div 
  ref={pickerRef}
  class="relative w-[90vw] max-w-80 sm:w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
>
      {/* Header */}
      <div class="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h3 class="text-xs sm:text-sm font-semibold text-gray-900">Emoji Picker</h3>
      </div>

      {/* Category Tabs */}
      <div class="flex gap-1 px-2 py-2 border-b border-gray-100 overflow-x-auto">
        {emojiCategories.map((category, index) => (
          <button
            key={category.name}
            onClick$={() => (activeCategory.value = index)}
            class={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${activeCategory.value === index
                ? 'bg-pink-100 text-pink-700'
                : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div class="p-2 sm:p-3 h-48 sm:h-64 overflow-y-auto">
        <div class="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
          {emojiCategories[activeCategory.value].emojis.map((emoji) => (
            <button
              key={emoji}
              onClick$={() => handleEmojiClick(emoji)}
              class="text-xl sm:text-2xl hover:bg-gray-100 rounded p-1 sm:p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Footer with frequently used */}
      <div class="px-2 sm:px-3 py-2 border-t border-gray-100 bg-gray-50">
        <p class="text-xs text-gray-500 mb-1.5">Frequently Used</p>
        <div class="flex gap-1 flex-wrap">
          {["😀", "❤️", "👍", "😂", "🎉", "🔥", "✨", "💯"].map((emoji) => (
            <button
              key={emoji}
              onClick$={() => handleEmojiClick(emoji)}
              class="text-lg sm:text-xl hover:bg-gray-200 rounded p-1 sm:p-1.5 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
