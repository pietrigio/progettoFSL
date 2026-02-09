const fs = require("fs");
const path = require("path");

const basePath = path.join(__dirname, "indices");

function createIndex(name) {
  const dir = path.join(basePath, name);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "data.json"), "[]");
  }
}

function listIndexes() {
  if (!fs.existsSync(basePath)) return [];
  return fs
    .readdirSync(basePath)
    .filter(name =>
      fs.statSync(path.join(basePath, name)).isDirectory()
    );
}


function deleteIndex(name) {
  fs.rmSync(path.join(basePath, name), { recursive: true, force: true });
}

function addVector(index, obj) {
  const file = path.join(basePath, index, "data.json");
  const data = JSON.parse(fs.readFileSync(file));
  data.push(obj);
  fs.writeFileSync(file, JSON.stringify(data));
}

function search(index, queryVector) {
  const file = path.join(basePath, index, "data.json");
  const data = JSON.parse(fs.readFileSync(file));

  return data
    .map(d => ({
      text: d.text,
      score: cosine(d.embedding, queryVector)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function cosine(a, b) {
  return a.reduce((sum, x, i) => sum + x * b[i], 0);
}

module.exports = {
  createIndex,
  listIndexes,
  deleteIndex,
  addVector,
  search
};
