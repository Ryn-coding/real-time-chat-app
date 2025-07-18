// Your existing import statements remain unchanged
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../AuthContext";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
// import { Picker } from 'emoji-mart';
// import 'emoji-mart/css/emoji-mart.css';
import CustomEmojiPicker from "../components/EmojiPicker";

const socket = io("https://real-time-chat-front-1hu6.onrender.com");

function Chat() {
    const { user, token, logout } = useAuth();
    const [receiverId, setReceiverId] = useState(null);
    const [message, setMessage] = useState("");
    const [chat, setChat] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [onlineUsers, setOnlineUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const navigate = useNavigate();
    const [showPicker, setShowPicker] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const typingTimeout = useRef(null);
    const [editingMsgId, setEditingMsgId] = useState(null);
    const tempId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchBox, setShowSearchBox] = useState(false);
    const inputRef = useRef();
    const editingRef = useRef(null);
    const editTextareaRef = useRef(null);
    const didFetchRef = useRef(false);
    const [hoveredMsgId, setHoveredMsgId] = useState(null);
    const [lastSeenMsgId, setLastSeenMsgId] = useState(null);
    const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
    const chatContainerRef = useRef(null);
    const audioRef = useRef(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleTogglePicker = () => {
        setShowPicker((prev) => !prev);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300); // match animation duration
    };


    const handleEmojiClick = (emoji) => {
        setMessage((prev) => prev + emoji);
        // setShowPicker(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                editingRef.current &&
                !editingRef.current.contains(e.target)
            ) {
                setEditingMsgId(null);
                setMessage('');
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (editTextareaRef.current) {
            const el = editTextareaRef.current;
            el.focus();

            // Move cursor to the end
            const length = el.value.length;
            el.setSelectionRange(length, length);
        }
    }, [editingMsgId]);



    // Capture Ctrl+F to toggle the search input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                setShowSearchBox(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Hide search on Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setShowSearchBox(false);
                setSearchTerm('');
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Filtered messages
    const filteredMessages = searchTerm
        ? chat.filter((msg) =>
            msg.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : chat;


    // SOCKET + AUTH JOIN
    useEffect(() => {
        if (user && user._id) {
            socket.emit("join", user._id);
            socket.on("receive-message", (msg) => {
                setChat((prev) => [...prev, msg]);
                if (msg.to === user._id) {
                    socket.emit("message-delivered", {
                        messageId: msg._id,
                        receiverId: user._id,
                    });
                }

            });
            return () => socket.off("receive-message");
        } else {
            navigate("/login");
        }
    }, [user, navigate]);

    // LOAD CHAT
    useEffect(() => {
        if (!receiverId || !user || !token) {
            setChat([]);
            return;
        }
        const loadMessages = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await axios.get(`https://real-time-chat-front-1hu6.onrender.com/api/messages/${receiverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChat(res.data.map(msg => ({
                    ...msg,
                    from: msg.from || msg.sender,
                    isSent: (msg.sender || msg.from) === user._id
                })));
            } catch (err) {
                setError("Failed to load messages.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadMessages();
    }, [receiverId, user, token]);

    // LOAD USERS
    useEffect(() => {
        if (!token || didFetchRef.current) return;
        didFetchRef.current = true;

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await axios.get("https://real-time-chat-front-1hu6.onrender.com/api/users", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(res.data.filter(u => u._id !== user._id));
            } catch (err) {
                setError("Unable to load users.");
                if (err.response?.status === 401) handleLogout();
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [token, user?._id]);

    // AUTO SCROLL TO BOTTOM
    useEffect(() => {
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
        return () => clearTimeout(timeout);
    }, [chat]);


    // ONLINE USERS
    useEffect(() => {
        socket.on("online-users", (data) => {
            setOnlineUsers(data);
        });
        return () => socket.off("online-users");
    }, []);

    // SEND
    const sendMessage = () => {
        if (!receiverId || (!message.trim() && !pendingFile)) return;
        const msg = {
            _id: tempId,
            from: user._id,
            to: receiverId,
            content: message.trim(),
            fileUrl: pendingFile?.url || '',
            fileType: pendingFile?.type || '',
            timestamp: new Date().toISOString()
        };
        socket.emit("send-message", msg);
        setChat((prev) => [...prev, { ...msg, isSent: true }]);
        setMessage("");
        setPendingFile(null);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
        socket.disconnect();
    };

    const getUsernameById = (id) => {
        if (id === user._id) return "You";
        const u = users.find(user => user._id === id);
        return u?.username || "Unknown";
    };

    const handleTyping = () => {
        socket.emit('typing', { to: receiverId, from: user._id });
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('stop-typing', { to: receiverId, from: user._id });
        }, 1000);
    };

    useEffect(() => {
        socket.on('typing', ({ from }) => {
            if (!typingUsers.includes(from)) {
                setTypingUsers((prev) => [...prev, from]);
            }
        });
        socket.on('stop-typing', ({ from }) => {
            setTypingUsers((prev) => prev.filter((id) => id !== from));
        });
        return () => {
            socket.off('typing');
            socket.off('stop-typing');
        };
    }, [typingUsers]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('https://real-time-chat-front-1hu6.onrender.com/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
            });
            // Store file info temporarily, wait for send button
            setPendingFile({
                url: res.data.url,
                type: file.type,
            });
            // setChat((prev) => [...prev, { ...msg, isSent: true }]);
        } catch (error) {
            console.error("Upload failed", error);
        }
    };
    const handleEditMessage = async (id) => {
        if (!message.trim()) return;

        try {
            const res = await axios.put(
                `https://real-time-chat-front-1hu6.onrender.com/api/messages/${id}`,
                { content: message },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setChat((prev) =>
                prev.map((msg) =>
                    msg._id === id ? { ...msg, content: res.data.content, edited: true } : msg
                )
            );

            socket.emit("edit-message", res.data);

            setEditingMsgId(null);
            setMessage("");
        } catch (err) {
            console.error("Edit failed", err);
        }
    };
    const handleDeleteMessage = async (id) => {
        try {
            await axios.delete(`https://real-time-chat-front-1hu6.onrender.com/api/messages/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const deletedMsg = chat.find((msg) => msg._id === id);
            if (deletedMsg) {
                socket.emit("delete-message", {
                    messageId: id,
                    to: deletedMsg.to,
                });
            }

            setChat((prev) => prev.filter((msg) => msg._id !== id));
        } catch (err) {
            console.error("Delete failed", err);
        }
    };
    useEffect(() => {
        socket.on("message-edited", (updatedMsg) => {
            setChat((prev) =>
                prev.map((msg) =>
                    msg._id === updatedMsg._id ? { ...msg, ...updatedMsg } : msg
                )
            );
        });

        socket.on("message-deleted", ({ messageId }) => {
            setChat((prev) => prev.filter((msg) => msg._id !== messageId));
        });

        return () => {
            socket.off("message-edited");
            socket.off("message-deleted");
        };
    }, []);

    useEffect(() => {
        socket.on("message-sent-confirmation", ({ tempId, realId }) => {
            setChat((prevChat) =>
                prevChat.map((msg) =>
                    msg._id === tempId ? { ...msg, _id: realId } : msg
                )
            );
        });

        return () => {
            socket.off("message-sent-confirmation");
        };
    }, []);



    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
    const contextMenuRef = useRef(null);

    // Handle outside click to close menu
    useEffect(() => {
        const handleClick = (e) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
                setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
            }
        };
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    const handleReact = (messageId, emoji) => {
        socket.emit("react-message", {
            messageId,
            emoji,
            userId: user._id,
        });
    };

    useEffect(() => {
        socket.on("message-reacted", ({ messageId, reactions }) => {
            setChat((prev) =>
                prev.map((msg) =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                )
            );
        });

        return () => socket.off("message-reacted");
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (!chatContainerRef.current) return;
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            setShowNewMsgBtn(scrollHeight - scrollTop - clientHeight > 100);
        };
        const ref = chatContainerRef.current;
        if (ref) ref.addEventListener('scroll', handleScroll);
        return () => ref && ref.removeEventListener('scroll', handleScroll);
    }, []);
    // Scroll to bottom on new message if at bottom or sent by self
    useEffect(() => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        if (scrollHeight - scrollTop - clientHeight < 100 || chat[chat.length - 1]?.from === user._id) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [chat, user._id]);


    // Helper: highlight search term
    const highlightTerm = (text) => {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.split(regex).map((part, i) =>
            regex.test(part) ? <span key={i} className="highlight-term">{part}</span> : part
        );
    };

    useEffect(() => {
        if (!selectedUser || !user) return;

        const unseenMessages = chat.filter(
            (msg) =>
                (msg.to === user._id || msg.receiver === user._id) &&
                (msg.from === selectedUser._id || msg.sender === selectedUser._id) &&
                (!msg.seenBy || !msg.seenBy.includes(user._id))
        );

        unseenMessages.forEach((msg) => {
            socket.emit("message-seen", {
                messageId: msg._id,
                userId: user._id,
            });
        });
    }, [selectedUser, chat, user]);




    return (
        <div className="h-[calc(100vh-79px)] flex flex-col lg:flex-row w-full bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
            {/* Sidebar */}
            <aside className="lg:w-1/4 w-full p-6 bg-white dark:bg-gray-900 shadow-md flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Chats</h2>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                    {users.map((u) => (
                        <div
                            key={u._id}
                            className={`p-4 rounded-lg flex justify-between items-center cursor-pointer transition hover:bg-blue-100 dark:hover:bg-gray-700 ${receiverId === u._id ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"
                                }`}
                            onClick={() => setReceiverId(u._id)}
                        >
                            <img
                                src={u.profilePicture || "/default-avatar.png"}
                                alt={u.username}
                                className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 dark:border-blue-300"
                            />
                            <div className="flex flex-col">
                                <span>{u.username}</span>
                                {typingUsers.includes(u._id) && (
                                    <p className="italic text-sm text-gray-300 dark:text-gray-300">Typing...</p>
                                )}
                            </div>
                            <span
                                className={`w-3 h-3 rounded-full ${onlineUsers.includes(u._id) ? "bg-green-500" : "bg-gray-400"
                                    }`}
                            ></span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleLogout}
                    className="mt-6 py-2 px-4 text-sm text-red-600 dark:text-red-400 border border-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900"
                >
                    Logout
                </button>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col justify-between p-6 bg-white dark:bg-gray-950">
                <div className="text-xl font-semibold mb-4">
                    {receiverId ? `Chat with ${getUsernameById(receiverId)}` : "Select someone to chat"}
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar relative" ref={chatContainerRef}>
                    {showNewMsgBtn && (
                        <button
                            className="fixed bottom-24 right-8 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-50 animate-bounce"
                            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            New Messages
                        </button>
                    )}
                    {showSearchBox && (
                        <div className="sticky top-0 bg-white dark:bg-gray-800 z-50 p-2 rounded shadow-md flex justify-between items-center border dark:border-gray-700">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-900 dark:text-white px-3 py-1 w-full mr-2 rounded outline-none"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setShowSearchBox(false);
                                }}
                                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm"
                            >
                                ✖
                            </button>
                        </div>
                    )}

                    {filteredMessages.map((msg, i) => (
                        <div
                            key={msg._id || i}
                            className={`group relative flex ${msg.from === user._id ? "justify-end mb-8" : "justify-start"}`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (msg.from === user._id) {
                                    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, messageId: msg._id });
                                }
                            }}
                        >
                            {/* Avatar */}
                            {msg.from !== user._id && (
                                <img
                                    src={users.find(u => u._id === msg.from)?.profilePicture || "/default-avatar.png"}
                                    alt={getUsernameById(msg.from)}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-400 dark:border-blue-300 mr-2 self-end"
                                />
                            )}
                            <div
                                className={`relative group p-3 rounded-lg max-w-md shadow-md message-fade-in ${msg.from === user._id
                                    ? "bg-blue-600 text-white rounded-br-none"
                                    : "bg-gray-300 dark:bg-gray-800 text-black dark:text-white rounded-bl-none"
                                    }`}
                                onMouseEnter={() => setHoveredMsgId(msg._id)}
                                onMouseLeave={() => setHoveredMsgId(null)}
                            >
                                {/* Sender Name */}
                                <div className="text-sm font-medium mb-1 opacity-80">
                                    {getUsernameById(msg.from)}
                                </div>
                                {/* Message Text */}
                                {msg.content && (
                                    <div>
                                        {editingMsgId === msg._id ? (
                                            // Editing mode
                                            <div ref={editingRef} className="relative">
                                                <textarea
                                                    ref={editTextareaRef}
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleEditMessage(msg._id);
                                                        }
                                                    }}
                                                    className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                />
                                                <div className="flex justify-end gap-2 mt-1">
                                                    <button
                                                        onClick={() => handleEditMessage(msg._id)}
                                                        className="text-sm text-green-600 dark:text-green-400 hover:underline"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingMsgId(null);
                                                            setMessage('');
                                                        }}
                                                        className="text-sm text-gray-500 dark:text-gray-300 hover:underline"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Reaction Picker Popup (only on hover) */}
                                                {hoveredMsgId === msg._id && (
                                                    <div className={`absolute -top-8 ${msg.from === user._id ? "-left-25" : "left-0"} z-10 bg-white dark:bg-gray-800 shadow rounded px-2 py-1 flex gap-1`}>
                                                        {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => {
                                                            const hasReacted = msg.reactions?.some(
                                                                (r) => r.userId === user._id && r.emoji === emoji
                                                            );
                                                            return (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => handleReact(msg._id, emoji)}
                                                                    className={`hover:scale-110  transition-transform text-xl p-1 rounded ${hasReacted ? "bg-blue-200  dark:bg-blue-600" : "hover:bg-gray-600"
                                                                        }`}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Message Content with highlight */}
                                                <p className="whitespace-pre-line break-words">{highlightTerm(msg.content)}</p>

                                                {/* Reactions below the message */}
                                                {msg.reactions?.length > 0 && (
                                                    <div className="absolute -bottom-3 flex gap-1 mt-1">
                                                        {Object.entries(
                                                            msg.reactions.reduce((acc, r) => {
                                                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                return acc;
                                                            }, {})
                                                        ).map(([emoji, count]) => (
                                                            <span key={emoji} className="text-sm px-1 rounded bg-blue-400 dark:bg-gray-700 shadow-lg">
                                                                {emoji} {count}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                            </>
                                        )}
                                    </div>
                                )}
                                {/* File Preview */}
                                {msg.fileUrl && (
                                    <div className="mt-2">
                                        {msg.fileType?.startsWith("image/") ? (
                                            <img
                                                src={msg.fileUrl}
                                                alt="sent file"
                                                className="max-w-xs max-h-60 rounded-md border dark:border-gray-600"
                                            />
                                        ) : (
                                            <a
                                                href={msg.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm underline text-blue-100 dark:text-blue-300"
                                            >
                                                📎 {msg.fileUrl.split("/").pop()}
                                            </a>
                                        )}
                                    </div>
                                )}
                                {/* Timestamp & Status */}
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-right opacity-60">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                    {msg.from === user._id && (
                                        <span className="ml-2 text-xs">

                                            {msg.seenBy?.includes(msg.to || msg.receiver)
                                                ? "✓✓" // Seen
                                                : msg.delivered
                                                    ? "✓"  // Delivered
                                                    : <span className="animate-pulse">...</span> // Sending
                                            }
                                        </span>
                                    )}

                                </div>
                            </div>
                            {/* Avatar for self (right) */}
                            {msg.from === user._id && (
                                <img
                                    src={user.profilePicture || "/default-avatar.png"}
                                    alt="You"
                                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-400 dark:border-blue-300 ml-2 self-end"
                                />
                            )}
                            {/* Edit/Delete Inline Below Message */}
                            {msg.from === user._id && editingMsgId !== msg._id && (
                                <div className="absolute -bottom-6 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingMsgId(msg._id);
                                            setMessage(msg.content);
                                        }}
                                        className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMessage(msg._id)}
                                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                            {/* Context Menu */}
                            {contextMenu.visible && contextMenu.messageId === msg._id && (
                                <div
                                    ref={contextMenuRef}
                                    className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
                                    style={{ top: contextMenu.y, left: contextMenu.x }}
                                >
                                    <button
                                        className="block px-4 py-2 text-sm text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                        onClick={() => {
                                            setEditingMsgId(msg._id);
                                            setMessage(msg.content);
                                            setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        className="block px-4 py-2 text-sm hover:bg-red-100 dark:hover:bg-red-700 w-full text-left"
                                        onClick={() => {
                                            handleDeleteMessage(msg._id);
                                            setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* Typing indicator (animated dots) */}
                    {typingUsers.filter(id => id === receiverId).length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="typing-indicator">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-300">Typing...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>


                {/* Message Input */}
                {receiverId && (
                    <div className="flex items-center gap-3 mt-4">
                        {pendingFile && (
                            <div className="flex items-center gap-3 mb-2 p-2 border rounded-lg dark:border-gray-700 bg-gray-100 dark:bg-gray-800 max-w-md">
                                {pendingFile.type.startsWith("image/") ? (
                                    <img src={pendingFile.url} alt="preview" className="w-16 h-16 object-cover rounded" />
                                ) : (
                                    <div className="flex items-center gap-2 text-sm">📎 <span>{pendingFile.url.split("/").pop()}</span></div>
                                )}
                                <button
                                    onClick={() => setPendingFile(null)}
                                    className="ml-auto text-red-500 hover:text-red-700 text-xl"
                                    title="Remove"
                                >
                                    ❌
                                </button>
                            </div>
                        )}

                        <textarea
                            rows={1}
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                handleTyping();
                            }}
                            onKeyDown={handleKeyPress}
                            className="flex-1 p-3 rounded-full border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-400 dark:bg-gray-900 dark:text-white"
                            placeholder="Type a message..."
                        />

                        <button onClick={handleTogglePicker}
                            className={`text-xl transform transition-transform duration-200 cursor-pointer ${isAnimating ? "scale-130" : "scale-100"
                                }`}
                        ><svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm5.495.93A.5.5 0 0 0 6.5 13c0 1.19.644 2.438 1.618 3.375C9.099 17.319 10.469 18 12 18c1.531 0 2.9-.681 3.882-1.625.974-.937 1.618-2.184 1.618-3.375a.5.5 0 0 0-.995-.07.764.764 0 0 1-.156.096c-.214.106-.554.208-1.006.295-.896.173-2.111.262-3.343.262-1.232 0-2.447-.09-3.343-.262-.452-.087-.792-.19-1.005-.295a.762.762 0 0 1-.157-.096ZM8.99 8a1 1 0 0 0 0 2H9a1 1 0 1 0 0-2h-.01Zm6 0a1 1 0 1 0 0 2H15a1 1 0 1 0 0-2h-.01Z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {showPicker && (
                            <CustomEmojiPicker
                                onEmojiClick={handleEmojiClick}
                                onClose={() => setShowPicker(false)}
                            />
                        )}

                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-blue-600"
                            title="Send File"
                        >
                            📎
                        </label>
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />

                        <button
                            onClick={sendMessage}
                            className="bg-blue-600 text-white py-2 px-6 rounded-full font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                            disabled={!message.trim() && !pendingFile}
                        >
                            Send
                        </button>
                    </div>
                )}
            </main>
        </div>

    );
}

export default Chat;
