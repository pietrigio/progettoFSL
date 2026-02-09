import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Chat from "./Chat";

export default function App() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // CARICA CHAT DAL BACKEND FASTAPI
  useEffect(() => {
    fetch("http://127.0.0.1:8000/chats")
      .then(r => r.json())
      .then(data => {
        setChats(data);
        if (data.length > 0) setActiveChatId(data[0].id);
      });
  }, []);

  function newChat() {
    const chat = {
      id: Date.now(),
      title: "Nuova chat",
      messages: []
    };

    setChats(prev => [chat, ...prev]);
    setActiveChatId(chat.id);

    fetch("http://127.0.0.1:8000/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chat)
    });
  }

  function updateChat(chat) {
    setChats(prev => prev.map(c => (c.id === chat.id ? chat : c)));

    fetch("http://127.0.0.1:8000/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chat)
    });
  }

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        chats={chats}
        activeId={activeChatId}
        onSelect={setActiveChatId}
        onNew={newChat}
      />
      {activeChat && (
        <Chat chat={activeChat} onUpdate={updateChat} />
      )}
    </div>
  );
}
