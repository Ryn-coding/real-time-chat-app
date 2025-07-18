// components/EmojiPicker.jsx
import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";

function CustomEmojiPicker({ onEmojiClick, onClose }) {
    const pickerRef = useRef();
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") === "dark" ? "dark" : "light";
    });

    useEffect(() => {

        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose(); // hide picker
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-20 right-40 z-10 bg-white border rounded shadow emoji-picker-animate"
        >
            <EmojiPicker theme={theme} onEmojiClick={(emojiData) => onEmojiClick(emojiData.emoji)} />
        </div>
    );
}

export default CustomEmojiPicker;
