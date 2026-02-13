import { useEffect, useState } from "react";

export default function FileChat({ onBack }) {
  const [indexes, setIndexes] = useState([]);
  const [selected, setSelected] = useState(null);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [openIndexMenu, setOpenIndexMenu] = useState(null);

  const [hoveredFile, setHoveredFile] = useState(null);
  const [openFileMenu, setOpenFileMenu] = useState(null);

  const [newName, setNewName] = useState("");
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState([]);

  // 🔥 CAMBIATO: usiamo messages invece di results
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    loadIndexes();
  }, []);

  function loadIndexes() {
    fetch("http://127.0.0.1:8000/indexes")
      .then(res => res.json())
      .then(async data => {
        setIndexes(data);

        if (data.length === 0) {
          setSelected(null);
          setFiles([]);
          setMessages([]);
          return;
        }

        const lastUsed = localStorage.getItem("lastIndex");

        const indexToSelect =
          lastUsed && data.includes(lastUsed)
            ? lastUsed
            : data[0];

        await selectIndex(indexToSelect);
      });
  }

  function loadFiles(index) {
    fetch(`http://127.0.0.1:8000/files/${index}`)
      .then(res => res.json())
      .then(setFiles);
  }

  async function selectIndex(name) {
    setSelected(name);
    localStorage.setItem("lastIndex", name);

    setOpenIndexMenu(null);
    loadFiles(name);

    // 🔥 carica chat salvata per indice
    const res = await fetch(`http://127.0.0.1:8000/index-chat/${name}`);
    const data = await res.json();
    setMessages(data);
  }

  async function createIndex() {
    if (!newName.trim()) return;

    setStatus("creazione...");
    const res = await fetch("http://127.0.0.1:8000/create-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    });

    const data = await res.json();
    if (data.ok) {
      setNewName("");
      setStatus("creato ✅");
      loadIndexes();
    } else {
      setStatus("esiste già ❌");
    }
  }

  async function uploadFile(e) {
    if (!selected) return;

    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(
      `http://127.0.0.1:8000/upload-file/${selected}`,
      { method: "POST", body: form }
    );

    const data = await res.json();
    if (data.ok) setFiles(data.files);
  }

  async function send() {
    if (!input.trim() || !selected) return;

    const question = input;
    setInput("");

    // 🔥 aggiorna subito UI con messaggio utente
    setMessages(prev => [
      ...prev,
      { role: "user", text: question }
    ]);

    const res = await fetch("http://127.0.0.1:8000/search-files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        index: selected,
        question: question
      })
    });

    const data = await res.json();

    // 🔥 il backend ora ritorna tutta la chat aggiornata
    setMessages(data);
  }

  async function deleteIndex(name) {
    await fetch(`http://127.0.0.1:8000/index/${name}`, { method: "DELETE" });

    if (localStorage.getItem("lastIndex") === name) {
      localStorage.removeItem("lastIndex");
    }

    setSelected(null);
    setFiles([]);
    setMessages([]);
    setOpenIndexMenu(null);
    loadIndexes();
  }

  async function deleteFile(filename) {
    await fetch(
      `http://127.0.0.1:8000/file/${selected}/${filename}`,
      { method: "DELETE" }
    );
    setOpenFileMenu(null);
    loadFiles(selected);
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* SIDEBAR IDENTICA ALLA TUA */}
      <div
        style={{
          width: 300,
          background: "#f4f4f4",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden"
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          <h3>Indici</h3>

          {indexes.map(name => (
            <div
              key={name}
              onClick={() => selectIndex(name)}
              style={{
                position: "relative",
                padding: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: selected === name ? "#ddd" : "transparent",
                cursor: "pointer"
              }}
              onMouseEnter={() => setHoveredIndex(name)}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setOpenIndexMenu(null);
              }}
            >
              <span>{name}</span>

              {hoveredIndex === name && (
                <span
                  style={{ cursor: "pointer", padding: "0 6px" }}
                  onClick={e => {
                    e.stopPropagation();
                    setOpenIndexMenu(openIndexMenu === name ? null : name);
                  }}
                >
                  ⋮
                </span>
              )}

              {openIndexMenu === name && (
                <div
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 30,
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: 6,
                    zIndex: 10
                  }}
                >
                  <div
                    style={{ cursor: "pointer", color: "red" }}
                    onClick={() => deleteIndex(name)}
                  >
                    🗑 Elimina
                  </div>
                </div>
              )}
            </div>
          ))}

          <hr />

          <input
            placeholder="Nuovo indice"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{ width: "100%" }}
          />
          <button onClick={createIndex} style={{ width: "100%" }}>
            Crea indice
          </button>

          {status && <p>{status}</p>}

          <hr />

          <input type="file" onChange={uploadFile} />

          <h4>File</h4>

          {files.length === 0 && <p>Nessun file</p>}
          {files.map(f => (
            <div key={f} style={{ padding: "6px 0" }}>
              <span>{f}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            height: "56px",
            padding: "10px",
            borderTop: "1px solid #ccc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box"
          }}
        >
          <button onClick={onBack} style={{ width: "100%" }}>
            ⬅ Torna al menu
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          <h2>Chat indice: {selected || "-"}</h2>

          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", marginBottom: 10 }}>
              <div
                style={{
                  padding: 8,
                  background: m.role === "user" ? "#007bff" : "#eee",
                  color: m.role === "user" ? "#fff" : "#000",
                  borderRadius: 6,
                  display: "inline-block"
                }}
              >
                {m.text}
              </div>

              {m.role === "bot" && m.files && (
                <div style={{ marginTop: 6 }}>
                  {m.files.length === 0 && <div>Nessun file trovato</div>}
                  {m.files.map((f, idx) => (
                    <div key={idx}>
                      <a href={f.download_url} target="_blank" rel="noopener noreferrer">
                        📥 Scarica {f.filename}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", padding: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            style={{ flex: 1 }}
            placeholder="Scrivi cosa cercare nei file..."
          />
          <button onClick={send}>Cerca</button>
        </div>
      </div>
    </div>
  );
}
