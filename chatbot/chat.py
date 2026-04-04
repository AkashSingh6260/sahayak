import os 
from dotenv import load_dotenv

from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain_classic.chains import create_history_aware_retriever, create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain  
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.prompts import MessagesPlaceholder
from langchain_community.chat_message_histories import ChatMessageHistory

load_dotenv()

class DocumentChatbot:
    def __init__(self, pdf_path: str = None):
        model_name = os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')
        self.llm = ChatGroq(model=model_name, temperature=0.2, api_key=os.getenv('GROQ_API_KEY'))
        
        
        self.embeddings = HuggingFaceEndpointEmbeddings(
            huggingfacehub_api_token=os.getenv('HF_API_KEY'),
            model="sentence-transformers/all-MiniLM-L6-v2"
        )
    
        if pdf_path:
            self.pdf_path = pdf_path
        else:
            self.pdf_path = r"C:\Ankita-new\Project1\chatbot\Sahayak_RAG_Policy_Guidelines.pdf"

        self.store = {}
        self._init_chain()

    def _get_session_history(self, session_id: str):
        if session_id not in self.store:
            self.store[session_id] = ChatMessageHistory()
        return self.store[session_id]

    def _init_chain(self):  
        if not os.path.exists(self.pdf_path):
            raise FileNotFoundError(f"PDF not found at {self.pdf_path}")
            
        loader = PyPDFLoader(self.pdf_path)
        documents = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=500)
        split_docs = splitter.split_documents(documents)
        vectorstore = FAISS.from_documents(documents=split_docs, embedding=self.embeddings)
        retriever = vectorstore.as_retriever()

        # ✅ Fixed: Proper prompt for history-aware retriever
        contextualize_q_system_prompt = """Given a chat history and the latest user question \
which might reference context in the chat history, formulate a standalone question \
which can be understood without the chat history. Do NOT answer the question, \
just reformulate it if needed and otherwise return it as is."""
        
        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ('system', contextualize_q_system_prompt),
            MessagesPlaceholder('chat_history'),
            ('user', '{input}') 
        ])

        history_aware_retriever = create_history_aware_retriever(
            llm=self.llm,
            retriever=retriever,
            prompt=contextualize_q_prompt
        )    

        # ✅ Answer generation prompt
        system_prompt = """You are Sahayak, an assistant for question-answering tasks.

Use the following pieces of retrieved context to answer the question.

Guidelines:
- Use ONLY the information from the provided context
- If the answer is in the context, respond clearly and directly
- If partially answered, explain what is known and what is missing
- If not in context, say: "I couldn't find this information in the provided documents."
- Do not guess or use outside knowledge
- Keep answers conversational, minimum 60 words, maximum 3-4 sentences
- Be accurate, clear, and easy to understand

Context:
{context}"""
     
        qa_prompt = ChatPromptTemplate.from_messages([
            ('system', system_prompt),
            MessagesPlaceholder('chat_history'),
            ('user', '{input}'),
        ])
    
        document_chain = create_stuff_documents_chain(self.llm, qa_prompt)
        
        self.rag_chain = create_retrieval_chain(history_aware_retriever, document_chain)
        
        self.conversational_chain = RunnableWithMessageHistory(
            self.rag_chain,
            self._get_session_history,
            input_messages_key="input",
            history_messages_key="chat_history",
            output_messages_key="answer"
        )  

    def ask(self, session_id: str, question: str):
        response = self.conversational_chain.invoke(
            {"input": question},
            config={"configurable": {"session_id": session_id}}
        )
        return response["answer"]