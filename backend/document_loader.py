import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin
from langchain_core.documents import Document
import xml.etree.ElementTree as ET


def load_and_split_xml(path):
    documents = []

    try:
        tree = ET.parse(path)
        root = tree.getroot()

        # Recursively collect text from all elements
        for elem in root.iter():
            text = elem.text.strip() if elem.text else ""
            if text:
                documents.append(Document(page_content=text))
    except Exception as e:
        print(f"⚠️ Error parsing XML: {str(e)}")

    return documents

def load_and_split_pdf(file_path: str, chunk_size: int = 1000, chunk_overlap: int = 200):
    try:
        print(f"📄 Loading PDF: {file_path}")
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        print(f"✅ Loaded {len(documents)} pages")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )

        chunks = splitter.split_documents(documents)
        print(f"✂️ Split into {len(chunks)} chunks")

        for doc in chunks:
            doc.metadata["source"] = os.path.basename(file_path)

        return chunks

    except Exception as e:
        print(f"❌ Error loading PDF: {str(e)}")
        raise RuntimeError(f"Failed to load and split PDF: {e}")

def scrape_website(base_url: str, limit_pages: int = 10):
    visited = set()
    to_visit = [base_url]
    pages_scraped = 0
    chunks = []

    while to_visit and pages_scraped < limit_pages:
        url = to_visit.pop(0)
        if url in visited:
            continue
        visited.add(url)

        try:
            res = requests.get(url, timeout=5)
            soup = BeautifulSoup(res.text, 'html.parser')

            # Add internal links
            for link in soup.find_all('a', href=True):
                full_url = urljoin(base_url, link['href'])
                if base_url in full_url and full_url not in visited:
                    to_visit.append(full_url)

            # Extract visible text
            text = soup.get_text(separator=' ', strip=True)
            chunks.append(Document(
                page_content=text[:1000],
                metadata={"source": "web", "url": url}
            ))
            pages_scraped += 1

        except Exception:
            continue

    return chunks