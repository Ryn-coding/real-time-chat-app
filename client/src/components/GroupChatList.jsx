import React, { useEffect, useState } from 'react';
// import { getUserGroups } from '../api/groups';
import { useAuth } from '../AuthContext';

export default function GroupChatList({ onSelectGroup }) {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const createGroup = async (groupData) =>
        await axios.post("http://localhost:5000/api/groups/create", groupData);
    const getUserGroups = async (userId) =>
        await axios.get(`http://localhost:5000/api/groups/user/${userId}`);


    useEffect(() => {
        getUserGroups(user._id).then(res => setGroups(res.data));
    }, []);

    return (
        <div>
            <h3>Group Chats</h3>
            <ul>
                {groups.map(group => (
                    <li key={group._id} onClick={() => onSelectGroup(group)}>
                        {group.name}
                    </li>
                ))}
            </ul>
        </div>
    );
}
