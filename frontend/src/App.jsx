import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
import FileChat from "./FileChat";

function App() {
  const [mode, setMode] = useState("menu"); // menu | normal | file
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/chats")
      .then(res => res.json())
      .then(data => {
        setChats(data);
        if (data.length > 0) setActiveId(data[0].id);
      });
  }, []);

  const activeChat = chats.find(c => c.id === activeId);

  function newChat() {
    const id = Date.now();
    setChats(prev => [{
      id,
      title: "Nuova chat",
      messages: []
    }, ...prev]);
    setActiveId(id);
  }

  function updateChat(updatedChat) {
    setChats(prev =>
      prev.map(c => c.id === updatedChat.id ? updatedChat : c)
    );

    fetch("http://127.0.0.1:8000/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedChat)
    });
  }

  async function deleteChat(id) {
    await fetch(`http://127.0.0.1:8000/chat/${id}`, {
      method: "DELETE"
    });

    const updated = chats.filter(c => c.id !== id);
    setChats(updated);

    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : null);
    }
  }


  return (
    <div style={{ height: "100vh", width: "100vw" }}>

      {mode === "menu" && (
        <div style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 20
        }}>
          <h1>MENU</h1>

          <button onClick={() => setMode("normal")}>
            Chat normale
          </button>

          <button onClick={() => setMode("file")}>
            Chat con file
          </button>
        </div>
      )}

      {mode === "normal" && (
        <div style={{ display: "flex", height: "100%" }}>
          <Sidebar
            chats={chats}
            activeId={activeId}
            onSelect={setActiveId}
            onNew={newChat}
            onBack={() => setMode("menu")}
            onDelete={deleteChat}
          />

          {activeChat && (
            <Chat chat={activeChat} onUpdate={updateChat} />
          )}
        </div>
      )}

      {mode === "file" && (
        <FileChat onBack={() => setMode("menu")} />
      )}
    </div>
  );
}

export default App;
