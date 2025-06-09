import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_community.vectorstores import Qdrant
from langchain_community.embeddings import HuggingFaceEmbeddings
import logging

# Load environment variables
load_dotenv()

# Initialize embedding model once (caching)
EMBEDDINGS = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Set embedding dimensions based on model
COLLECTION_DIMENSIONS = 384  # for MiniLM-L6

def get_qdrant_client() -> QdrantClient:
    try:
        client = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY"),
            prefer_grpc=False,
            timeout=300  # 5 minute timeout
        )
        # Test connection
        client.get_collections()
        return client
    except Exception as e:
        logging.error(f"Failed to connect to Qdrant: {str(e)}")
        raise RuntimeError(f"Failed to connect to Qdrant: {str(e)}")

def ensure_collection_exists(client: QdrantClient, collection_name: str):
    """Ensure collection exists with proper configuration"""
    try:
        collections = client.get_collections()
        collection_names = [collection.name for collection in collections.collections]
        
        if collection_name not in collection_names:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=COLLECTION_DIMENSIONS,
                    distance=Distance.COSINE
                ),
                optimizers_config={
                    "default_segment_number": 2,
                    "max_optimization_threads": 4,
                    "memmap_threshold": 20000,
                    "indexing_threshold": 20000,
                    "payload_indexing_threshold": 20000,
                    "flush_interval_sec": 5
                },
                wal_config={
                    "wal_capacity_mb": 32,
                    "wal_segments_capacity_mb": 64
                }
            )
    except Exception as e:
        logging.error(f"Failed to ensure collection exists: {str(e)}")
        raise RuntimeError(f"Failed to ensure collection exists: {str(e)}")

def get_embedding_model():
    return EMBEDDINGS  # Return the already-loaded model

def get_vectorstore(client: QdrantClient, collection_name: str):
    try:
        # Ensure collection exists with proper configuration
        ensure_collection_exists(client, collection_name)
        
        return Qdrant(
            client=client,
            collection_name=collection_name,
            embeddings=EMBEDDINGS,  # Use cached model directly
            content_payload_key="page_content",
            metadata_payload_key="metadata"
        )
    except Exception as e:
        logging.error(f"Failed to create vectorstore: {str(e)}")
        raise RuntimeError(f"Failed to create vectorstore: {str(e)}")
