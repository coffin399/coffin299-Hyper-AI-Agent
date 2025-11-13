from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os

from ..core.agent import HyperAIAgent, AgentConfig

app = FastAPI(title="Hyper AI Agent API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent
agent = HyperAIAgent()

class MessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class MessageResponse(BaseModel):
    response: str
    conversation_id: str

@app.get("/")
async def root():
    return {"message": "Welcome to Hyper AI Agent API"}

@app.post("/chat", response_model=MessageResponse)
async def chat(request: Request, message_request: MessageRequest):
    """Process a chat message and return the agent's response."""
    try:
        # Process the message
        response = await agent.process_message(message_request.message)
        
        # For now, using a simple conversation ID
        # In a production environment, you'd want to manage conversations properly
        conversation_id = message_request.conversation_id or "default"
        
        return {
            "response": response,
            "conversation_id": conversation_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset_conversation():
    """Reset the conversation history."""
    agent.reset_conversation()
    return {"status": "conversation_reset"}

def start_server(host: str = "0.0.0.0", port: int = 8000):
    """Start the FastAPI server."""
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    start_server()
