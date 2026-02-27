import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
import FileChat from "./FileChat";
import "./styles/App.css";

function App() {
  const [mode, setMode] = useState("menu");
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:8000/chats")
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
      prev.map(c =>
        c.id === updatedChat.id ? updatedChat : c
      )
    );

    fetch("http://localhost:8000/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedChat),
    }).catch(err => {
      console.error("Errore salvataggio:", err);
    });
  }



  async function deleteChat(id) {
    await fetch(`http://localhost:8000/chat/${id}`, {
      method: "DELETE"
    });

    const updated = chats.filter(c => c.id !== id);
    setChats(updated);

    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : null);
    }
  }

  return (
    <div className="app-container">

      {mode === "menu" && (
        <div className="menu-container">
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
        <div className="normal-layout">
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
