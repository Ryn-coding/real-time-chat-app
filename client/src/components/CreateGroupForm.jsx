import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";

function CreateGroupForm({ onGroupCreated }) {
  const { token, user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMembers(res.data.filter(u => u._id !== user._id)); // exclude self
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName || selectedUsers.length === 0) return alert("All fields required");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/groups",
        { name: groupName, members: [...selectedUsers, user._id] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onGroupCreated(res.data); // callback
      setGroupName("");
      setSelectedUsers([]);
    } catch (err) {
      console.error("Error creating group", err);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-white shadow w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4">Create New Group</h2>

      <div className="mb-4">
        <label className="block font-semibold">Group Name</label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full border px-3 py-2 rounded mt-1"
          placeholder="Enter group name"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Select Members</label>
        <div className="max-h-40 overflow-y-auto border p-2 rounded bg-gray-50">
          {members.map((u) => (
            <div key={u._id} className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={selectedUsers.includes(u._id)}
                onChange={() => toggleUser(u._id)}
              />
              <span className="ml-2">{u.name || u.email}</span>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Create Group
      </button>
    </form>
  );
}

export default CreateGroupForm;
