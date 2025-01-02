import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Camera, Plus } from "lucide-react";
import styles from "./Chat.module.css";


const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [expandedMessage, setExpandedMessage] = useState(null); 
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const [conversations, setConversations] = useState([]);
  const [newTitle, setNewTitle] = useState(""); // Add this state for new conversation title
  const [showNewConversationInput, setShowNewConversationInput] = useState(false); // Add this state

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const handleCreateNewConversation = async () => {
    if (!newTitle.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again.");
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
        // Add new conversation to the list
        setConversations(prev => [...prev, { id: data.conversation_id, title: newTitle }]);
        // Reset input and hide it
        setNewTitle("");
        setShowNewConversationInput(false);
        // Navigate to the new conversation
        navigate(`/chat/${data.conversation_id}`);
      } else {
        throw new Error("Failed to create new conversation");
      }
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch all conversations for sidebar
  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in again.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/conversations", {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (err) {
        setError("Failed to load conversations");
      }
    };

    fetchConversations();
  }, [navigate]);

  // Fetch current conversation
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in again.");
          navigate("/");
          return;
        }

        const response = await fetch(
          `http://localhost:5000/conversation/${conversationId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.messages) {
            setMessages(data.messages);
            setChatTitle(data.title);
            
            // Set the emotion based on the last user message
            const userMessages = Object.values(data.messages).filter(msg => msg.role === "user");
            if (userMessages.length > 0) {
              const lastUserMessage = userMessages[userMessages.length - 1];
              if (lastUserMessage.emotion) {
                setCurrentEmotion(lastUserMessage.emotion);
              }
            }
          }
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId, navigate]);

  const initializeWebcam = async () => {
    try {
      if (!streamRef.current) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        videoRef.current.srcObject = mediaStream;
        streamRef.current = mediaStream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });

        setIsWebcamReady(true);
      }
    } catch {
      setError("Webcam access failed.");
    }
  };

  const captureSnapshot = async () => {
    if (!isWebcamReady) await initializeWebcam();

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const canvas = document.createElement("canvas");
          const video = videoRef.current;

          if (!video || !video.videoWidth) {
            resolve(null);
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const context = canvas.getContext("2d");
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const snapshot = canvas.toDataURL("image/jpeg", 0.8);
          resolve(snapshot);
        } catch {
          resolve(null);
        }
      }, 500);
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in again.");
      navigate("/");
      return;
    }

    try {
      const snapshot = await captureSnapshot();
      const payload = { message: newMessage, snapshot };

      // Immediately add the new message to the UI
      const tempMessageId = Date.now().toString();
      const newMessageObj = {
        role: "user",
        message: newMessage,
        snapshot: snapshot,
        emotion: currentEmotion // Use current emotion as default
      };

      setMessages(prevMessages => ({
        ...prevMessages,
        [tempMessageId]: newMessageObj
      }));

      const response = await fetch(
        `http://localhost:5000/conversation/${conversationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Server response:", data); // For debugging

        if (data && data.updated_messages) {
          setMessages(data.updated_messages);
          
          // Update emotion based on the new message
          const newUserMessage = Object.values(data.updated_messages)
            .find(msg => msg.message === newMessage && msg.role === "user");
          if (newUserMessage?.emotion) {
            setCurrentEmotion(newUserMessage.emotion);
          }
        }
        
        setNewMessage("");

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setIsWebcamReady(false);
        }
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleConversationClick = (convId) => {
    navigate(`/chat/${convId}`);
  };

  if (loading) return <div className="loading-container">Loading conversation...</div>;

  return (
    <div className={styles['chat-page-container']}>
      <div className={styles['sidebar']}>
        <h3 className={styles['sidebar-title']}>Conversations</h3>
        <div className={styles['new-conversation-section']}>
          {showNewConversationInput ? (
            <div className={styles['new-conversation-input-group']}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter conversation title"
                className={styles['new-conversation-input']}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNewConversation();
                  }
                }}
              />
              <button 
                onClick={handleCreateNewConversation}
                className={styles['create-button']}
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewConversationInput(true)}
              className={styles['new-conversation-button']}
            >
              <Plus size={20} />
              New Conversation
            </button>
          )}
        </div>

        <div className={styles['conversation-list']}>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`${styles['conversation-item']} ${
                conv.id === conversationId ? styles['active'] : ''
              }`}
              onClick={() => handleConversationClick(conv.id)}
            >
              {conv.title}
            </div>
          ))}
        </div>
      </div>

      <div className={`${styles['chat-container']} ${styles[`emotion-${currentEmotion}`]}`}>
        <div className={styles['form-wrapper']}>
          <h2 className={styles['chat-title']}>{chatTitle}</h2>

          {error && (
            <div className={styles['message error-message']}>
              {error}
            </div>
          )}

<div className={styles['message-area']}>
  {messages && Object.entries(messages).length > 0 ? (
    Object.entries(messages)
      .sort(([keyA], [keyB]) => keyA - keyB)
      .map(([key, msg]) => {
        const isUser = msg.role === "user";
        const emotionClass = isUser ? styles[`emotion-${msg.emotion}`] : "";

        return (
          <div
            key={key}
            className={`${styles['message-container']} ${
              isUser ? styles['sender-message'] : styles['receiver-message']
            }`}
          >
            <div className={`${styles['message-content']} ${emotionClass}`}>
              {isUser ? (
                // User's message
                msg.message.split("\n").map((line, i) => (
                  <p key={i} className={styles['message-text']}>
                    {line}
                  </p>
                ))
              ) : (
                // Therapist's response
                <>
                  <p className={styles['message-text']}>{msg.answer}</p>
                <hr></hr>
                  {/* Expandable button for therapy details */}
                  <button
  className={styles['therapy-toggle']}
  onClick={() => setExpandedMessage(expandedMessage === key ? null : key)}
>
  {expandedMessage === key ? (
    "▲" // Up arrow for "Hide"
  ) : (
    "▼" // Down arrow for "View"
  )}
</button>



                  {/* Therapy details section */}
                  {expandedMessage === key && (
                    <div className={styles['therapy-details']}>
                      <h4 className={styles['therapy-name']}>
                        <strong>Technique:</strong> {msg.therapy.name}
                      </h4>
                      <p className={styles['therapy-reason']}>
                        <strong>Reason:</strong> {msg.therapy.reason}
                      </p>
                      <p className={styles['therapy-description']}>
                        <strong>Description:</strong> {msg.therapy.description}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })
  ) : (
    <p>No messages found.</p>
  )}
</div>



          <div className={styles['input-area']}>
            <input
              type="text"
              placeholder="Type a message"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles['input']}
            />
            <button onClick={sendMessage} className={styles['send-button']}>
              <Camera className={styles['camera-icon']} />
              Send
            </button>
          </div>

          <video ref={videoRef} autoPlay playsInline muted className={styles['hidden']} />
        </div>
      </div>
    </div>
  );
};

export default Chat;