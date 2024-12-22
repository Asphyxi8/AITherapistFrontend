import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Conversations.module.css"; // Importing CSS module

const Conversations = () => {
    const [conversations, setConversations] = useState([]);
    const [newTitle, setNewTitle] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConversations = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/");
                return;
            }

            try {
                const response = await fetch("http://localhost:5000/conversations", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setConversations(data);
                } else {
                    setError("Failed to load conversations. Please log in again.");
                    localStorage.removeItem("token");
                    navigate("/");
                }
            } catch (err) {
                setError("An error occurred while fetching conversations.");
            }
        };

        fetchConversations();
    }, [navigate]);

    const handleNewConversation = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/new_conversation", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ title: newTitle }),
            });

            if (response.ok) {
                const data = await response.json();
                setConversations((prev) => [...prev, { id: data.conversation_id, title: newTitle, messages: "" }]);
                setNewTitle("");
            } else {
                setError("Failed to create new conversation.");
            }
        } catch (err) {
            setError("An error occurred while creating the conversation.");
        }
    };

    const handleConversationClick = (conversationId) => {
        navigate(`/chat/${conversationId}`);
    };

    return (
        <div className={styles.conversationsContainer}>
            <div className={styles.header}>
                <h2>Conversations</h2>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.newConversation}>
                <input
                    type="text"
                    placeholder="Enter conversation title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className={styles.input}
                />
                <button onClick={handleNewConversation} className={styles.createButton}>
                    Create Conversation
                </button>
            </div>
            <ul className={styles.conversationList}>
                {conversations.map((conv) => (
                    <li
                        key={conv.id}
                        onClick={() => handleConversationClick(conv.id)}
                        className={styles.conversationCard}
                    >
                        {conv.title}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Conversations;
