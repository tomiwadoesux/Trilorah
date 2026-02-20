#!/usr/bin/env python3
"""
ML Resolver WebSocket Server
Uses session manager for advanced preaching behaviors
"""
import json
import asyncio
import re
import os
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from normalize import normalize_text
from state_machine import update_reference, reset_state, get_current_state
from session import (
    process_text, 
    get_session, 
    reset_session, 
    set_emit_callback,
    is_next_command,
)
from resolver import resolve

app = FastAPI(title="Bible Resolver ML Service")

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if trained model exists
MODEL_PATH = Path(__file__).parent / "model"
USE_ML = MODEL_PATH.exists() and (MODEL_PATH / "config.json").exists()

if USE_ML:
    print("🧠 Loading trained ML model...")
    from transformers import T5Tokenizer, T5ForConditionalGeneration
    import torch
    
    tokenizer = T5Tokenizer.from_pretrained(str(MODEL_PATH))
    model = T5ForConditionalGeneration.from_pretrained(str(MODEL_PATH))
    model.eval()
    print("✅ ML model loaded")
else:
    print("⚠️ No trained model found, using session manager + regex")
    tokenizer = None
    model = None


# Active WebSocket connections for broadcasting
active_connections: list[WebSocket] = []


async def broadcast_session(data: dict):
    """Broadcast session update to all connected clients"""
    message = json.dumps({"type": "session", **data})
    for ws in active_connections:
        try:
            await ws.send_text(message)
        except:
            pass


def sync_emit_callback(data: dict):
    """Sync callback for session manager - schedules async broadcast"""
    # This runs in a thread, so we need to schedule the async broadcast
    # For now, we'll just print - the WebSocket handler will emit
    print(f"📖 Session update ready: {data}")


# Set up session callback
set_emit_callback(sync_emit_callback)


@app.get("/health")
async def health():
    return {"status": "ok", "ml_enabled": USE_ML}


@app.get("/state")
async def state():
    """Get current state machine state"""
    s = get_current_state()
    return s.to_dict()


@app.get("/session")
async def session():
    """Get current session state"""
    s = get_session()
    return s.to_dict()


@app.post("/reset")
async def reset():
    """Reset state machine and session"""
    reset_state()
    reset_session()
    return {"status": "reset"}


@app.websocket("/resolve")
async def resolver_ws(ws: WebSocket):
    await ws.accept()
    active_connections.append(ws)
    print("🔌 ML Resolver client connected")
    
    # Reset session for new connection
    reset_session()
    reset_state()
    
    try:
        while True:
            msg = await ws.receive_text()
            data = json.loads(msg)
            
            if data.get("type") != "transcript":
                continue
            
            text = data.get("text", "").strip()
            if len(text) < 2:
                continue
            
            # Process through session manager first
            session_result = process_text(text)
            
            if session_result and session_result.get("book"):
                # Session manager handled it
                await ws.send_text(json.dumps({
                    "type": "verse",
                    **session_result,
                    "confidence": 0.95,
                }))
                print(f"🎯 Session: {session_result.get('book')} {session_result.get('chapter')}:{session_result.get('verse')}")
            else:
                # Fallback to state machine
                normalized = normalize_text(text)
                result = update_reference(normalized)
                
                if result and result.get("book") and result.get("chapter"):
                    await ws.send_text(json.dumps({
                        "type": "verse",
                        **result
                    }))
                    print(f"🎯 Resolved: {result['book']} {result['chapter']}:{result.get('verse', '')}")
                else:
                    # Log failed resolutions
                    if len(text) > 5 and not is_next_command(text):
                        with open("failures.log", "a") as f:
                            f.write(f"{text} | normalized: {normalized}\n")
    
    except WebSocketDisconnect:
        print("🔌 Client disconnected")
        active_connections.remove(ws)
        reset_session()
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        if ws in active_connections:
            active_connections.remove(ws)


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting ML Resolver server on ws://127.0.0.1:8765")
    uvicorn.run(app, host="127.0.0.1", port=8765)
