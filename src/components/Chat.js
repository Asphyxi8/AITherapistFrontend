import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import styles from "./Chat.module.css";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [chatTitle, setChatTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
          setMessages(data.messages);
          setChatTitle(data.title);
        } else {
          throw new Error(`Server returned ${response.status}`);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
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
        const updatedMessages = await response.json();
        setMessages(updatedMessages.updated_messages);
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
      setError(err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
};

if (loading) return <div className="loading-container">Loading conversation...</div>;

return (
    <div className={styles['chat-container']}>

    <div className={styles['form-wrapper']}>

        <h2 className={styles['chat-title']}>{chatTitle}</h2>

        {error && (
            <div className={styles['message error-message']}>
                {error}
            </div>
        )}

<div className={styles['message-area']}>
    {Object.keys(messages).length > 0 ? (
        Object.entries(messages).map(([key, msg]) => {
            const emotionClass =
                msg.role === "user" ? styles[`emotion-${msg.emotion}`] : "";

            return (
                <div
                    key={key}
                    className={`${styles['message-container']} ${
                        msg.role === "user"
                            ? styles['sender-message']
                            : styles['receiver-message']
                    }`}
                >
                    <div
                        className={`${styles['message-content']} ${emotionClass}`}
                    >
                        {msg.message.split("\n").map((line, i) => (
                            <p key={i} className={styles['message-text']}>
                                {line}
                            </p>
                        ))}
                        {msg.snapshot && (
                            <img
                                src={msg.snapshot}
                                alt="Message snapshot"
                                className={styles['message-image']}
                            />
                        )}
                    </div>
                </div>
            );
        })
    ) : (
        <p className={styles['no-messages']}>No messages yet.</p>
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
            <button onClick={sendMessage} className={styles['primaryButton send-button']}>
                <Camera className={styles['camera-icon']} />
                Send
            </button>
            
        </div>
        {/* <h2 className={styles['chat-title']}>{emotion}</h2> */}

        <video ref={videoRef} autoPlay playsInline muted className={styles['hidden']} />

    </div>

</div>
)
};

export default Chat;