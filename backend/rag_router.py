from typing import List, Tuple
from langchain_core.documents import Document
from vectorstore_setup import get_vectorstore, get_embedding_model
from llm_utils import get_llm, get_rag_chain

CONFIDENCE_THRESHOLD = 0.2

def query_agent(qdrant_client, collection_name: str, question: str) -> Tuple[str, List[Document]]:
    embedding_model = get_embedding_model()
    question_embedding = embedding_model.embed_query(question)

    vectorstore = get_vectorstore(qdrant_client, collection_name)
    results = vectorstore.similarity_search_with_score_by_vector(question_embedding, k=4)

    if not results:
        return "No matching documents found.", []

    avg_score = sum(score for _, score in results) / len(results)
    if avg_score < CONFIDENCE_THRESHOLD:
        return "Sorry, not enough relevant context found.", []

    docs = [doc for doc, _ in results]

    context = "\n\n".join(doc.page_content for doc in docs)

    llm = get_llm()
    rag_chain = get_rag_chain(llm, context, question)
    answer = rag_chain.invoke({})


    return answer, docs
def route_and_answer(question, qdrant_client, collection_names):
    for name in collection_names:
        collection = f"agent_{name}"
        vectorstore = get_vectorstore(qdrant_client, collection)
        docs = vectorstore.similarity_search(question, k=4)
        if docs:
            return name, docs[0].page_content, docs
    return "unknown", "Sorry, I couldn’t find enough relevant info.", []