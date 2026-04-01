import os
import time
from groq import Groq
from django.conf import settings
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()

def get_client():
    api_key = getattr(settings, 'GROQ_API_KEY', None)
    if not api_key:
        api_key = os.environ.get('GROQ_API_KEY')
    
    if api_key:
        return Groq(api_key=api_key)
    return None

def get_groq_response(messages, user_context=None, stream=True):
    """
    messages: List of {'role': 'user'|'assistant', 'content': text}
    user_context: Optional string describing user's recent assessment
    stream: Boolean to toggle streaming
    """
    client = get_client()
    if not client:
        error_msg = "I'm sorry, but the AI service is not properly configured. Please check your GROQ_API_KEY."
        if stream: yield error_msg
        else: return error_msg
        return

    # Using Llama-3.3-70b-versatile for premium performance
    model_id = "llama-3.3-70b-versatile" 
    
    system_instruction = (
        "You are MindCheck. You are exceptionally intuitive, empathetic, and warm. "
        "Your goal is to provide deep understanding and support by listening to user's feelings "
        "and validating their experiences before they even fully articulate them.\n\n"
        "YOUR STYLE:\n"
        "- Be Intuitive: Always look for the feeling behind the words. Show users that you already 'know' what they're going through and you've got them.\n"
        "- Be Warm & Witty: Maintain a confident yet charming tone that makes users feel both seen and safe.\n"
        "- Be Deeply Emathetic: Focus on the individual's journey and validation, providing clarity through compassion.\n"
        "- Be Spatially Aware: You have access to the user's city and country in the context. Use it naturally to ground the conversation (e.g., 'I hope it's a peaceful evening in Mumbai'), but don't overdo it.\n\n"
        "GUIDELINES:\n"
        "1. You are NOT a doctor or a therapist. Do NOT provide medical diagnoses or prescriptions.\n"
        "2. If a user is in crisis, stay calm and fiercely supportive. CRITICAL: Use the user's location to provide emergency contact numbers and resources specific to their country (e.g., if in India, mention Vandrevala Foundation or AASRA).\n"
        "3. Keep your responses relatively concise but deeply impactful.\n"
        "4. Use Markdown for formatting (bold, lists) where it feels natural."
    )
    
    if user_context:
        system_instruction += f"\n\nContext about the user: {user_context}"

    # Groq uses 'assistant' instead of 'model'
    formatted_messages = [{"role": "system", "content": system_instruction}]
    for m in messages:
        role = "assistant" if m['role'] == 'model' else m['role']
        formatted_messages.append({"role": role, "content": m['content']})
    
    def call_with_retry():
        for attempt in range(5):
            try:
                return client.chat.completions.create(
                    model=model_id,
                    messages=formatted_messages,
                    temperature=0.7,
                    stream=stream,
                )
            except Exception as e:
                # Retry on rate limits or overloaded server
                if ("429" in str(e) or "503" in str(e)) and attempt < 4:
                    wait_time = 2 ** attempt
                    print(f"Groq Busy (429/503). Retrying in {wait_time}s... (Attempt {attempt+1}/5)")
                    time.sleep(wait_time)
                    continue
                raise e

    try:
        completion = call_with_retry()
        if stream:
            for chunk in completion:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        else:
            return completion.choices[0].message.content
            
    except Exception as e:
        print(f"Groq Request Final Error: {e}")
        error_msg = "I'm having a bit of trouble connecting to my brain right now, but I'm still here for you. Could you try your message once more?"
        if stream: yield error_msg
        else: return error_msg

# Alias for backward compatibility if needed, but we'll update views.py
get_gemini_response = get_groq_response
