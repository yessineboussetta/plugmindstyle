from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
import os
from langchain_community.vectorstores import Qdrant
from vectorstore_setup import get_embedding_model

AGENTS_REGISTRY = set()

def create_agent(client: QdrantClient, name: str) -> str:
    collection_name = f"chatbot_{name}"
    try:
        client.get_collection(collection_name)
    except Exception:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE
            )
        )
    return collection_name

def get_all_agent_names():
    base_dir = "vectorstores"
    if not os.path.exists(base_dir):
        return []
    return [name.replace("agent_", "") for name in os.listdir(base_dir) if name.startswith("agent_")]
