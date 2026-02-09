const express = require("express");
const multer = require("multer");
const WebSocket = require("ws");

const { createIndex, listIndexes, deleteIndex } = require("./vectorStore");
const { loadPdf } = require("./pdfLoader");
const { ragQuery } = require("./rag");

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });

/* ===== INDICI ===== */
app.post("/index", (req, res) => {
  createIndex(req.body.name);
  res.sendStatus(200);
});

app.get("/index", (req, res) => {
  res.json(listIndexes());
});

app.delete("/index/:name", (req, res) => {
  deleteIndex(req.params.name);
  res.sendStatus(200);
});

/* ===== UPLOAD PDF ===== */
app.post("/upload/:index", upload.single("file"), async (req, res) => {
  await loadPdf(req.file.path, req.params.index, req.file.originalname);
  res.sendStatus(200);
});

/* ===== SERVER + WEBSOCKET ===== */
const server = app.listen(3000, () => {
  console.log("Backend attivo su http://localhost:3000");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", ws => {
  ws.on("message", async message => {
    const { question, index } = JSON.parse(message);

    for await (const chunk of ragQuery(question, index)) {
      ws.send(chunk);
    }

    ws.send("__END__");
  });
});
