import os
from dotenv import load_dotenv
from urllib.parse import urlparse
from langdetect import detect

from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

def get_llm(temperature: float = 0, max_tokens: int = 1000, model: str = "mistralai/mistral-7b-instruct:free"):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("Missing OPENROUTER_API_KEY")

    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=temperature,
        max_tokens=max_tokens
    )

def extract_brand(website_url: str) -> str:
    if not website_url:
        return "our website"
    try:
        domain = urlparse(website_url).netloc
        brand = domain.replace("www.", "").split(".")[0]
        return brand.capitalize()
    except:
        return "our website"

def get_user_language(text: str) -> str:
    try:
        return detect(text)
    except:
        return "en"

def get_rag_chain(llm, context: str, question: str, website_url: str = ""):
    brand = extract_brand(website_url)
    lang = get_user_language(question)

    prompt_templates = {
        "fr": f"""Tu es un assistant professionnel de support pour **{brand}**.

Réponds comme si tu faisais partie de l'équipe {brand}, en utilisant uniquement les informations fournies ci-dessous.

Ces informations proviennent de la documentation interne et du site officiel de {brand}. Sois clair, concis et utile. Si tu n'es pas sûr, recommande de contacter le support ou de consulter le site directement.

---
Contexte :
{{context}}

---
Question :
{{question}}

Réponse :
""",
        "en": f"""You are a professional, helpful support assistant for **{brand}**.

Answer the user as if you're part of the {brand} team, using only the information provided below.

This information comes from internal documentation and the official {brand} website. Be clear, concise, and helpful. If you're unsure, recommend contacting support or checking the site directly.

---
Context:
{{context}}

---
Question:
{{question}}

Answer:
""",
        "ar": f"""أنت مساعد دعم محترف يعمل مع فريق **{brand}**.

أجب على المستخدم باستخدام المعلومات الموجودة أدناه فقط.

تستند هذه المعلومات إلى الوثائق الداخلية والموقع الرسمي لـ {brand}. كن واضحًا ومباشرًا. إذا لم تكن متأكدًا، اقترح على المستخدم التواصل مع الدعم أو مراجعة الموقع.

---
السياق:
{{context}}

---
السؤال:
{{question}}

الإجابة:
"""
    }

    prompt_text = prompt_templates.get(lang, prompt_templates["en"])
    prompt = PromptTemplate.from_template(prompt_text)

    return (
        {
            "context": lambda _: context,
            "question": lambda _: question
        }
        | prompt
        | llm
        | StrOutputParser()
    )
