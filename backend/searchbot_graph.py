import os
import logging
from typing import Dict
from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import HTTPException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_community.utilities.sql_database import SQLDatabase
from langchain.agents.agent_toolkits import SQLDatabaseToolkit
from langchain_community.tools.sql_database.tool import InfoSQLDatabaseTool
from langgraph.graph import END, StateGraph
from supabase import create_client
import json
from sqlalchemy import text


# Load environment variables
load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Configure LLM
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
assert OPENROUTER_KEY, "Missing OpenRouter API Key!"

llm = ChatOpenAI(
    model_name="mistralai/mistral-7b-instruct:free",
    openai_api_base="https://openrouter.ai/api/v1",
    openai_api_key=OPENROUTER_KEY,
    temperature=0
)

# Define state
class GraphState(Dict):
    query: str
    sql: str
    results: list

# Node 1: Generate SQL
def generate_sql(db: SQLDatabase, allowed_tables: list):
    def _run(state: GraphState):
        logging.debug("🟡 STEP 1: Fetching schema for SQL generation")
        try:
            tools = SQLDatabaseToolkit(db=db, llm=llm).get_tools()
            schema_tool = next((t for t in tools if t.name == "sql_db_schema"), None)
            if not schema_tool:
                raise RuntimeError("SQL schema tool not found in toolkit")
            schema = schema_tool.invoke({"table_names": ", ".join(allowed_tables)})
            logging.debug("📐 Retrieved schema:\n" + schema)

            prompt = PromptTemplate.from_template("""
You are a powerful SQL assistant designed to interact with a MySQL database and answer questions using SELECT-only queries.

Instructions:
- ALWAYS start by inspecting the table names and schema provided.
- Use ONLY the tables and columns explicitly shown in the schema.
- NEVER use INSERT, UPDATE, DELETE, DROP, or any modification queries.
- Use LIKE '%value%' for fuzzy text searches.
- If the user asks about multiple things (e.g. hotels and activities), you can:
    • Either use JOINs if relational fields exist
    • Or run two separate SELECT queries and return results for both.
- Always LIMIT the results to 12 unless the user asks for a specific number.
- Choose meaningful columns, never SELECT *.
- Order results by the most relevant field if needed (e.g., rating, price, date).
- Double-check your SQL syntax.
- If an error is detected in the SQL or it is too complex, simplify it and retry.
- You can wrap multiple queries using -- Query 1 / -- Query 2 for clarity.

{schema}

User question:
{question}

SQL:
""")

            rendered = prompt.format(question=state["query"], schema=schema)
            logging.debug("📤 Rendered Prompt:\n%s", rendered)

            sql = (prompt | llm | StrOutputParser()).invoke({
                "question": state["query"],
                "schema": schema
            }).strip()

            logging.info("🧠 SQL Generated: %s", sql)
            return {"query": state["query"], "sql": sql}

        except Exception as e:
            logging.error("❌ SQL generation failed", exc_info=True)
            return {"query": state["query"], "sql": "", "results": f"Final Answer: SQL generation failed. {str(e)}"}

    return _run

# Node 2: Execute SQL
def execute_sql(db: SQLDatabase):
    def _run(state: GraphState):
        logging.debug("🟢 STEP 2: Executing SQL Query")
        try:
            if not state.get("sql"):
                return {"results": "Final Answer: SQL generation failed. No SQL to execute."}

            sql_queries = [q.strip() for q in state["sql"].split(";") if q.strip()]
            final_results = []

            for q in sql_queries:
                try:
                    with db._engine.connect() as conn:
                        result = conn.execute(text(q))  # Use SQLAlchemy's text() function
                        rows = result.fetchall()
                        columns = result.keys()
                        dict_rows = [dict(zip(columns, row)) for row in rows]
                        final_results.extend(dict_rows)
                except Exception as e:
                    final_results.append({
                        "error": f"Error running query: {q}",
                        "details": str(e)
                    })

            return {"results": final_results}

        except Exception as e:
            logging.error("❌ SQL execution failed", exc_info=True)
            return {"results": [{"error": f"Final Answer: SQL execution failed. {str(e)}"}]}

    return _run



# Build LangGraph
def build_searchbot_graph(db: SQLDatabase, allowed_tables: list):
    builder = StateGraph(GraphState)
    builder.add_node("generate_sql", generate_sql(db, allowed_tables))
    builder.add_node("run_query", execute_sql(db))
    builder.set_entry_point("generate_sql")
    builder.add_edge("generate_sql", "run_query")
    builder.add_edge("run_query", END)
    return builder.compile()

# Request model
class ChatRequest(BaseModel):
    query: str

# Cache
agent_cache: Dict[str, object] = {}

# Handler
async def handle_search_query(searchbot_id: str, request: ChatRequest):
    logging.info("🔍 Incoming searchbot query: %s", request.query)
    try:
        bot_data = supabase.table("searchbots").select("*").eq("id", searchbot_id).single().execute().data
        if not bot_data:
            raise HTTPException(status_code=404, detail="Searchbot not found")

        db_uri = f"mysql+pymysql://{bot_data['db_user']}:{bot_data['db_pass']}@{bot_data['db_host']}/{bot_data['db_name']}"
        logging.debug("🔗 DB URI constructed for bot %s", searchbot_id)

        allowed_tables = bot_data.get("allowed_tables") or []
        if isinstance(allowed_tables, str):
            allowed_tables = json.loads(allowed_tables)
        logging.debug("📦 Allowed tables: %s", allowed_tables)

        if not allowed_tables:
            raise HTTPException(400, detail="No allowed tables configured for this searchbot")

        if searchbot_id not in agent_cache:
            logging.info("⚙️ Building new LangGraph agent for bot %s", searchbot_id)
            db = SQLDatabase.from_uri(db_uri, include_tables=allowed_tables)
            db._get_sample_rows = lambda table_name: ""
            graph = build_searchbot_graph(db, allowed_tables)
            agent_cache[searchbot_id] = graph

        graph = agent_cache[searchbot_id]
        state = graph.invoke({"query": request.query})

        logging.info("📤 Final Answer: %s", state.get("results"))
        return {"answer": state.get("results")}

    except Exception as e:
        logging.exception("LangGraph SearchBot failed")
        raise HTTPException(500, f"LangGraph SearchBot error: {str(e)}")