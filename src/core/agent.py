from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Message(BaseModel):
    """A message in the conversation."""
    role: str  # 'system', 'user', or 'assistant'
    content: str

class AgentConfig(BaseModel):
    """Configuration for the Hyper AI Agent."""
    model: str = "gpt-4-turbo-preview"
    temperature: float = 0.7
    max_tokens: int = 2000
    system_prompt: str = "You are Hyper AI, a helpful AI assistant."

class HyperAIAgent:
    """Hyper AI Agent core class."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the Hyper AI Agent.
        
        Args:
            config: Optional configuration dictionary to override defaults
        """
        self.config = AgentConfig(**(config or {}))
        self.conversation_history: List[Message] = [
            Message(role="system", content=self.config.system_prompt)
        ]
        
        # Initialize OpenAI client
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def process_message(self, user_input: str) -> str:
        """Process a user message and return the AI's response.
        
        Args:
            user_input: The user's message
            
        Returns:
            The AI's response
        """
        # Add user message to conversation history
        self.conversation_history.append(
            Message(role="user", content=user_input)
        )
        
        try:
            # Call the OpenAI API
            response = await self.client.chat.completions.create(
                model=self.config.model,
                messages=[msg.dict() for msg in self.conversation_history],
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens,
            )
            
            # Extract the assistant's response
            assistant_message = response.choices[0].message.content
            
            # Add assistant's response to conversation history
            self.conversation_history.append(
                Message(role="assistant", content=assistant_message)
            )
            
            return assistant_message
            
        except Exception as e:
            return f"Error processing message: {str(e)}"
    
    def reset_conversation(self) -> None:
        """Reset the conversation history while keeping the system prompt."""
        self.conversation_history = [
            Message(role="system", content=self.config.system_prompt)
        ]
