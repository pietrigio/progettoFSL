def retrieve_docs(question: str):
    # simulazione retrieval
    return [
        "Documento 1: informazioni rilevanti",
        "Documento 2: altro contesto utile"
    ]

def generate_answer(question: str, docs: list[str]):
    context = "\n".join(docs)
    return f"Usando questi documenti:\n{context}\n\nRisposta alla domanda: {question}"
