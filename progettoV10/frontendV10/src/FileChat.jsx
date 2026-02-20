import { useEffect, useState, useRef } from "react";

export default function FileChat({ onBack }) {
  const [indexes, setIndexes] = useState([]);
  const [selected, setSelected] = useState(null);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [openIndexMenu, setOpenIndexMenu] = useState(null);

  const [hoveredFile, setHoveredFile] = useState(null);
  const [openFileMenu, setOpenFileMenu] = useState(null);

  const [newName, setNewName] = useState("");
  const [files, setFiles] = useState([]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [openViewer, setOpenViewer] = useState(null);
  const [viewerContent, setViewerContent] = useState("");
  const [viewerQuery, setViewerQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);

  // 🔥 NUOVI STATE
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadIndexes();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function loadIndexes() {
    fetch("http://localhost:8000/indexes")
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
    fetch(`http://localhost:8000/files/${index}`)
      .then(res => res.json())
      .then(setFiles);
  }

  async function selectIndex(name) {
    setSelected(name);
    localStorage.setItem("lastIndex", name);
    setOpenIndexMenu(null);

    loadFiles(name);

    const res = await fetch(`http://localhost:8000/index-chat/${name}`);
    const data = await res.json();
    setMessages(data);
  }

  async function deleteIndex(name) {
    await fetch(`http://localhost:8000/index/${name}`, {
      method: "DELETE"
    });

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
      `http://localhost:8000/file/${selected}/${filename}`,
      { method: "DELETE" }
    );

    setOpenFileMenu(null);
    loadFiles(selected);
  }

  async function createIndex() {
    if (!newName.trim()) return;

    const res = await fetch("http://localhost:8000/create-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName })
    });

    const data = await res.json();
    if (data.ok) {
      setNewName("");
      loadIndexes();
    }
  }

  async function uploadFileDirect(file) {
    if (!selected || !file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(
      `http://localhost:8000/upload-file/${selected}`,
      { method: "POST", body: form }
    );

    const data = await res.json();
    if (data.ok) setFiles(data.files);
  }

  async function uploadFile(e) {
    uploadFileDirect(e.target.files[0]);
  }

  async function send() {
    if (!input.trim() || !selected) return;

    const question = input;
    setInput("");

    setMessages(prev => [
      ...prev,
      { role: "user", text: question }
    ]);

    setLoading(true);

    const res = await fetch("http://localhost:8000/search-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index: selected,
        question: question
      })
    });

    const data = await res.json();
    setMessages(data);
    setLoading(false);
  }

  async function openFileViewer(filename, query) {
    const res = await fetch(
      `http://localhost:8000/file-content/${selected}/${filename}`
    );
    const data = await res.json();

    if (data.content) {
      const highlighted = highlightText(data.content, query);
      const count = (highlighted.match(/class="match-highlight"/g) || []).length;

      setMatchCount(count);
      setCurrentMatchIndex(0);
      setViewerContent(highlighted);
      setViewerQuery(query);
      setOpenViewer(filename);

      setTimeout(() => {
        scrollToMatch(0);
      }, 100);
    }
  }

  function scrollToMatch(index) {
    const elements = document.querySelectorAll(".match-highlight");
    if (!elements.length) return;

    elements[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function nextMatch() {
    if (matchCount === 0) return;
    const next = (currentMatchIndex + 1) % matchCount;
    setCurrentMatchIndex(next);
    scrollToMatch(next);
  }

  function prevMatch() {
    if (matchCount === 0) return;
    const prev = (currentMatchIndex - 1 + matchCount) % matchCount;
    setCurrentMatchIndex(prev);
    scrollToMatch(prev);
  }

  function highlightText(text, query) {
    if (!query) return text;

    const words = query.split(" ").filter(w => w.trim());
    let highlighted = text;

    words.forEach(word => {
      const regex = new RegExp(`(${word})`, "gi");
      highlighted = highlighted.replace(
        regex,
        `<mark class="match-highlight">$1</mark>`
      );
    });

    return highlighted;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* SIDEBAR */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          uploadFileDirect(file);
        }}
        style={{
          width: 300,
          background: isDragging ? "#d0f0ff" : "#f4f4f4",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div style={{ flex: 1, padding: 10, overflowY: "auto" }}>
          <h3>Indici</h3>

          {indexes.map(name => (
            <div
              key={name}
              onClick={() => selectIndex(name)}
              onMouseEnter={() => setHoveredIndex(name)}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setOpenIndexMenu(null);
              }}
              style={{
                position: "relative",
                padding: 8,
                background: selected === name ? "#ddd" : "transparent",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>{name}</span>

              {hoveredIndex === name && (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    setOpenIndexMenu(openIndexMenu === name ? null : name);
                  }}
                  style={{ padding: "0 6px", cursor: "pointer" }}
                >
                  ⋮
                </div>
              )}

              {openIndexMenu === name && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: 6,
                    zIndex: 10
                  }}
                >
                  <div
                    onClick={() => deleteIndex(name)}
                    style={{ cursor: "pointer", color: "red" }}
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

          <hr />
          <input type="file" onChange={uploadFile} />

          <h4 style={{ marginTop: 15 }}>File nell'indice</h4>

          {files.map(f => (
            <div
              key={f}
              onMouseEnter={() => setHoveredFile(f)}
              onMouseLeave={() => {
                setHoveredFile(null);
                setOpenFileMenu(null);
              }}
              style={{
                position: "relative",
                padding: "6px 8px",
                marginTop: 4,
                background: "#fff",
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>📄 {f}</span>

              {hoveredFile === f && (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    setOpenFileMenu(openFileMenu === f ? null : f);
                  }}
                  style={{ cursor: "pointer", padding: "0 6px" }}
                >
                  ⋮
                </div>
              )}

              {openFileMenu === f && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    background: "#fff",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    padding: 6,
                    zIndex: 10
                  }}
                >
                  <div
                    onClick={() => deleteFile(f)}
                    style={{ cursor: "pointer", color: "red" }}
                  >
                    🗑 Elimina
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: 10 }}>
          <button onClick={onBack} style={{ width: "100%" }}>
            ⬅ Torna al menu
          </button>
        </div>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", marginBottom: 10 }}>
              <div className={m.role === "user" ? "bubble user" : "bubble bot"}>
                {m.text}
              </div>

              {m.role === "bot" && m.files && (
                <div style={{ marginTop: 6 }}>
                  {m.files.length === 0 && (
                    <div style={{ fontSize: 14, opacity: 0.6 }}>
                      Nessun file trovato
                    </div>
                  )}

                  {m.files.map((f, idx) => (
                    <div key={idx}>
                      <button
                        onClick={() => openFileViewer(f.filename, m.query)}
                        className="open-file-btn"
                      >
                        📂 Apri {f.filename}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="bubble bot loading">
              🔎 Sto cercando nei file...
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        <div style={{ display: "flex", padding: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            style={{ flex: 1 }}
            placeholder="Scrivi cosa cercare..."
          />
          <button onClick={send}>Cerca</button>
        </div>
      </div>

      {/* MODAL */}
      {openViewer && (
        <div
          onClick={() => setOpenViewer(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "80%",
              height: "80%",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column"
            }}
          >

            {/* HEADER FISSO */}
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#fff",
                position: "sticky",
                top: 0,
                zIndex: 5
              }}
            >
              <h2>{openViewer}</h2>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={prevMatch}>⬆</button>
                <span>
                  {matchCount === 0 ? 0 : currentMatchIndex + 1} / {matchCount}
                </span>
                <button onClick={nextMatch}>⬇</button>
                <button onClick={() => setOpenViewer(null)}>✖</button>
              </div>
            </div>

            {/* DOWNLOAD */}
            <div style={{ padding: "10px 20px" }}>
              <a
                href={`http://localhost:8000/download/${selected}/${openViewer}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📥 Scarica file
              </a>
            </div>

            {/* CONTENUTO SCROLLABILE */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 20,
                whiteSpace: "pre-wrap"
              }}
              dangerouslySetInnerHTML={{ __html: viewerContent }}
            />

          </div>
        </div>
      )}

    </div>
  );
}
