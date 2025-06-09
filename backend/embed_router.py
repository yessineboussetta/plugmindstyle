from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from vectorstore_setup import get_qdrant_client
from rag_router import query_agent  # ✅ Use your existing RAG logic

router = APIRouter()

@router.get("/chatbot/embed/{chatbot_id}", response_class=HTMLResponse)
async def embed_chatbot_ui(chatbot_id: int):
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Chatbot {chatbot_id}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="module" src="/static/chatbot_{chatbot_id}.js"></script>
    </head>
    <body>
        <div id="root"></div>
    </body>
    </html>    
    """

@router.post("/chatbot/embed/{chatbot_id}", response_class=HTMLResponse)
async def handle_chatbot_query(chatbot_id: int, request: Request):
    form = await request.form()
    user_message = form.get("user_message")

    # RAG logic
    qdrant = get_qdrant_client()
    collection_name = f"chatbot_{chatbot_id}"
    answer, docs = query_agent(qdrant, collection_name, user_message)

    return f"""
    <html>
    <body style="background-color: #111; color: white; padding: 20px;">
        <h2>Chatbot #{chatbot_id}</h2>
        <div style="background: #222; padding: 20px;">
            <p><strong>You:</strong> {user_message}</p>
            <p><strong>Bot:</strong> {answer}</p>
        </div>
        <form method="post" action="/chatbot/embed/{chatbot_id}">
            <input name="user_message" placeholder="Type your message..." style="width: 80%;"/>
            <button type="submit">Send</button>
        </form>
    </body>
    </html>
    """
