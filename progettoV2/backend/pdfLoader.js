const fs = require("fs");
const { embed } = require("./embeddings");
const { addVector } = require("./vectorStore");

async function loadPdf(filePath, index, filename) {
  const text = fs.readFileSync(filePath, "utf8"); // simulazione
  const chunks = text.match(/.{1,500}/g) || [];

  chunks.forEach(chunk => {
    addVector(index, {
      embedding: embed(chunk),
      text: chunk,
      file: filename
    });
  });
}

module.exports = { loadPdf };
