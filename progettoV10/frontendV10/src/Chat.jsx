import { useEffect, useRef, useState } from "react";

export default function Chat({ chat, onUpdate }) {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState(chat.messages);
  const [loading, setLoading] = useState(false);

  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  // sincronizza messaggi quando cambio chat
  useEffect(() => {
    setLocalMessages(chat.messages);
  }, [chat]);

  // AUTO SCROLL
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, loading]);

  // crea websocket UNA SOLA VOLTA
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (e) => {
      if (e.data === "__END__") {
        setLoading(false);
        return;
      }

      setLocalMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          ...updated[lastIndex],
          text: updated[lastIndex].text + e.data,
        };

        onUpdate({
          id: chat.id,
          title: chat.title,
          messages: updated,
        });

        return updated;
      });
    };

    ws.onerror = (err) => {
      console.log("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [chat.id]);



  if (!chat) return null;

  function send() {
    if (!input.trim()) return;

    const question = input;

    const newMessages = [
      ...localMessages,
      { role: "user", text: question },
      { role: "bot", text: "" },
    ];

    setLocalMessages(newMessages);
    setLoading(true);

    const updatedChat = {
      ...chat,
      title:
        chat.messages.length === 0
          ? question.slice(0, 30)
          : chat.title,
      messages: newMessages,
    };

    onUpdate(updatedChat);

    wsRef.current.send(JSON.stringify({ question }));

    setInput("");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
        {localMessages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.role === "user" ? "right" : "left",
              marginBottom: "10px",
            }}
          >
            <span
              className={m.role === "user" ? "bubble user" : "bubble bot"}
            >
              {m.text}
            </span>
          </div>
        ))}

        {loading && (
          <div style={{ marginBottom: "10px" }}>
            <span className="bubble bot loading">
              🤖 Sto pensando...
            </span>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      <div style={{ display: "flex", padding: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flex: 1 }}
          placeholder="Scrivi un messaggio..."
        />
        <button onClick={send}>Invia</button>
      </div>
    </div>
  );
}
