const { embed } = require("./embeddings");
const { search } = require("./vectorStore");

async function* ragQuery(question, index) {
  const qVector = embed(question);
  const docs = search(index, qVector);

  const response = "Risposta generata dal modello.";

  for (const char of response) {
    await new Promise(r => setTimeout(r, 25));
    yield char;
  }
}

module.exports = { ragQuery };
