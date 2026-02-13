import { useEffect, useRef, useState } from "react";

export default function Chat({ chat, onUpdate }) {
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState(chat.messages);
  const wsRef = useRef(null);

  // sincronizza messaggi quando cambio chat
  useEffect(() => {
    setLocalMessages(chat.messages);
  }, [chat]);

  // crea websocket UNA SOLA VOLTA
  useEffect(() => {
    wsRef.current = new WebSocket("ws://127.0.0.1:8000/ws");

    wsRef.current.onmessage = (e) => {
      if (e.data === "__END__") return;

      setLocalMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;

        updated[lastIndex] = {
          ...updated[lastIndex],
          text: updated[lastIndex].text + e.data,
        };

        // aggiorno anche stato globale
        onUpdate({
          ...chat,
          messages: updated,
        });

        return updated;
      });
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

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
              style={{
                padding: "8px",
                background: m.role === "user" ? "#007bff" : "#eee",
                color: m.role === "user" ? "#fff" : "#000",
                borderRadius: "6px",
                display: "inline-block",
              }}
            >
              {m.text}
            </span>
          </div>
        ))}
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
