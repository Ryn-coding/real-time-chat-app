import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import CreateGroupForm from "../components/CreateGroupForm";

const socket = io("http://localhost:5000"); // Replace with your backend URL

function GroupChat() {
    const { user, token } = useAuth();
    const [groups, setGroups] = useState([]);
    const [activeGroup, setActiveGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        if (activeGroup) {
            socket.emit("join-group", activeGroup._id);
            fetchGroupMessages(activeGroup._id);
        }
    }, [activeGroup]);

    useEffect(() => {
        socket.on("receive-group-message", (msg) => {
            if (msg.receiver === activeGroup?._id) {
                setMessages((prev) => [...prev, msg]);
            }
        });

        return () => {
            socket.off("receive-group-message");
        };
    }, [activeGroup]);

    const fetchGroups = async () => {
        const res = await axios.get("http://localhost:5000/api/groups", {
            headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(res.data);
    };

    const fetchGroupMessages = async (groupId) => {
        const res = await axios.get(`http://localhost:5000/api/group-messages/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(res.data);
    };

    const handleSend = () => {
        if (!newMsg.trim()) return;

        const msg = {
            sender: user._id,
            groupId: activeGroup._id,
            content: newMsg,
        };

        socket.emit("send-group-message", msg);
        setNewMsg("");
    };

    return (
        <div className="flex h-screen">
            <div className="mb-4">
                <CreateGroupForm onGroupCreated={(newGroup) => setGroups([...groups, newGroup])} />
            </div>
            {/* Sidebar: Group list */}
            <div className="w-1/4 bg-gray-800 text-white p-4 overflow-auto">
                <h2 className="text-xl font-bold mb-4">My Groups</h2>
                {groups.map((group) => (
                    <div
                        key={group._id}
                        onClick={() => setActiveGroup(group)}
                        className={`cursor-pointer p-2 rounded mb-2 ${activeGroup?._id === group._id ? "bg-gray-600" : "hover:bg-gray-700"}`}
                    >
                        {group.name}
                    </div>
                ))}
            </div>

            {/* Main Chat */}
            <div className="flex flex-col w-3/4 p-4">
                {activeGroup ? (
                    <>
                        <h2 className="text-2xl font-bold mb-2">{activeGroup.name}</h2>
                        <div className="flex-1 border rounded p-3 overflow-auto bg-gray-50">
                            {messages.map((msg) => (
                                <div key={msg._id} className={`mb-2 ${msg.sender === user._id ? "text-right" : "text-left"}`}>
                                    <span className="inline-block px-3 py-1 bg-blue-100 rounded">
                                        {msg.content}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                            <input
                                type="text"
                                value={newMsg}
                                onChange={(e) => setNewMsg(e.target.value)}
                                className="flex-1 border rounded px-2 py-1"
                                placeholder="Type a message..."
                            />
                            <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-1 rounded">
                                Send
                            </button>
                        </div>
                    </>
                ) : (
                    <p className="text-gray-500">Select a group to start chatting</p>
                )}
            </div>
        </div>
    );
}

export default GroupChat;
