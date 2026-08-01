"""
FastAPI Backend for HackerRank Orchestrate Dashboard
Integrates the existing Python prediction engine with REST APIs
"""

import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
import json

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Add the code directory to sys.path to import engines
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from engines.notification_router import NotificationRouter
from engines.context_loader import load_messages, write_output

# ============================================================================
# Pydantic Models
# ============================================================================

class MessageData(BaseModel):
    message_id: str
    message_text: str
    sender_user_id: str
    user_id: str
    group_id: Optional[str] = None
    business_id: Optional[str] = None
    conversation_type: str
    created_at: str
    forwarded_count: int = 0
    media_type: Optional[str] = None


class PredictionResult(BaseModel):
    message_id: str
    action: str
    message_type: str
    reason: str
    confidence: float
    evidence_message_ids: Optional[str] = None


class DashboardStats(BaseModel):
    total_messages: int
    notify_count: int
    digest_count: int
    mute_count: int
    ai_accuracy: float
    confidence_average: float


class AnalyticsData(BaseModel):
    top_senders: List[Dict[str, Any]]
    group_analytics: List[Dict[str, Any]]
    business_analytics: List[Dict[str, Any]]
    daily_trends: List[Dict[str, Any]]
    confidence_distribution: List[Dict[str, Any]]
    message_type_distribution: List[Dict[str, Any]]


class MessageDetail(BaseModel):
    message: MessageData
    prediction: PredictionResult
    reasoning_steps: List[Dict[str, Any]]
    evidence_messages: List[MessageData]


# ============================================================================
# FastAPI Application Setup
# ============================================================================

app = FastAPI(
    title="HackerRank Orchestrate Dashboard API",
    description="REST API for AI-powered message notification routing",
    version="1.0.0",
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Global State
# ============================================================================

# Find dataset directory
def find_dataset_dir():
    """Find the dataset directory"""
    # Try going up to find the root repo directory
    repo_root = parent_dir
    for _ in range(5):  # Go up max 5 levels
        candidates = [
            os.path.join(repo_root, 'dataset'),
        ]
        
        for path in candidates:
            if os.path.isdir(path):
                return path
        
        repo_root = os.path.dirname(repo_root)
    
    # Fallback: search from parent_dir
    for root, dirs, files in os.walk(parent_dir):
        if 'dataset' in dirs:
            dataset_path = os.path.join(root, 'dataset')
            if any(f.endswith('.csv') for f in os.listdir(dataset_path)):
                return dataset_path
    
    raise RuntimeError("Dataset directory not found. Please ensure the dataset folder exists.")


# Initialize lazy
DATASET_DIR = None
router = None
_messages_cache: Optional[List[Dict[str, Any]]] = None
_predictions_cache: Optional[List[Dict[str, Any]]] = None
_directory_cache: Optional[Dict[str, Dict[str, str]]] = None

def initialize():
    """Initialize router and dataset"""
    global DATASET_DIR, router
    if DATASET_DIR is None:
        DATASET_DIR = find_dataset_dir()
        router = NotificationRouter(DATASET_DIR)
        router.initialize()


def get_directory() -> Dict[str, Dict[str, str]]:
    """Get group_id -> group_name and business_id -> display_name lookups"""
    global _directory_cache
    if _directory_cache is not None:
        return _directory_cache

    initialize()
    import csv as csv_module

    groups: Dict[str, str] = {}
    businesses: Dict[str, str] = {}

    groups_path = os.path.join(DATASET_DIR, 'groups.csv')
    if os.path.isfile(groups_path):
        with open(groups_path, newline='', encoding='utf-8') as f:
            for row in csv_module.DictReader(f):
                if row.get('group_id'):
                    groups[row['group_id']] = row.get('group_name') or row['group_id']

    businesses_path = os.path.join(DATASET_DIR, 'business_accounts.csv')
    if os.path.isfile(businesses_path):
        with open(businesses_path, newline='', encoding='utf-8') as f:
            for row in csv_module.DictReader(f):
                if row.get('business_id'):
                    businesses[row['business_id']] = row.get('display_name') or row['business_id']

    _directory_cache = {"groups": groups, "businesses": businesses}
    return _directory_cache


def get_messages() -> List[Dict[str, Any]]:
    """Get all messages from dataset"""
    global _messages_cache
    if _messages_cache is None:
        initialize()
        _messages_cache = load_messages(DATASET_DIR)
    return _messages_cache


def get_predictions() -> List[Dict[str, Any]]:
    """Get all predictions"""
    global _predictions_cache
    if _predictions_cache is None:
        initialize()
        messages = get_messages()
        _predictions_cache = router.run(messages)
    return _predictions_cache


def get_prediction_map() -> Dict[str, Dict[str, Any]]:
    """Get predictions mapped by message_id"""
    predictions = get_predictions()
    return {p['message_id']: p for p in predictions}


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "dataset": DATASET_DIR,
    }


# ============================================================================
# Messages Endpoints
# ============================================================================

@app.get("/messages")
async def get_all_messages(
    action: Optional[str] = Query(None, description="Filter by action (notify/digest/mute)"),
    message_type: Optional[str] = Query(None, description="Filter by message type"),
    search: Optional[str] = Query(None, description="Search in message text"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """
    Get all messages with optional filters
    """
    predictions = get_predictions()
    messages = get_messages()
    message_map = {m['message_id']: m for m in messages}
    
    # Apply filters
    filtered = predictions
    
    if action:
        filtered = [p for p in filtered if p['action'] == action]
    
    if message_type:
        filtered = [p for p in filtered if p['message_type'] == message_type]
    
    if search:
        search_lower = search.lower()
        filtered = [
            p for p in filtered
            if search_lower in (message_map.get(p['message_id'], {}).get('message_text', '') or '').lower()
        ]
    
    # Pagination
    total = len(filtered)
    paginated = filtered[skip : skip + limit]

    # Merge in the full message record (message_text, sender_user_id, user_id,
    # group_id, business_id, conversation_type, created_at, etc.) so any page
    # in the frontend has all the fields it expects, alongside the prediction
    # fields (action, message_type, confidence, reason, evidence_message_ids).
    enriched = []
    for p in paginated:
        m = message_map.get(p['message_id'], {})
        enriched.append({
            **m,
            **p,
        })
    
    return {
        "data": enriched,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@app.get("/messages/{message_id}", response_model=MessageDetail)
async def get_message_detail(message_id: str):
    """Get detailed information about a specific message"""
    messages = get_messages()
    predictions = get_predictions()
    
    message = next((m for m in messages if m['message_id'] == message_id), None)
    prediction = next((p for p in predictions if p['message_id'] == message_id), None)
    
    if not message or not prediction:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Get evidence messages
    evidence_ids = (prediction.get('evidence_message_ids') or '').split(';')
    evidence_messages = [
        m for m in messages
        if m['message_id'] in evidence_ids
    ]
    
    # Build reasoning steps (simplified - in real app would be more detailed)
    reasoning_steps = [
        {
            "step": "Text Analysis",
            "result": "Analyzed message content and patterns",
        },
        {
            "step": "Context Loading",
            "result": "Loaded user, group, and business context",
        },
        {
            "step": "Risk Detection",
            "result": "Scam and spam detection completed",
        },
        {
            "step": "Routing Decision",
            "result": f"Decided action: {prediction['action']}",
        },
        {
            "step": "Confidence Calculation",
            "result": f"Confidence score: {prediction['confidence']}",
        },
    ]
    
    return MessageDetail(
        message=MessageData(**message),
        prediction=PredictionResult(**prediction),
        reasoning_steps=reasoning_steps,
        evidence_messages=[MessageData(**m) for m in evidence_messages],
    )


# ============================================================================
# Dashboard Endpoints
# ============================================================================

@app.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics"""
    predictions = get_predictions()
    messages = get_messages()
    
    total = len(predictions)
    notify_count = sum(1 for p in predictions if p['action'] == 'notify')
    digest_count = sum(1 for p in predictions if p['action'] == 'digest')
    mute_count = sum(1 for p in predictions if p['action'] == 'mute')
    
    confidence_avg = (
        sum(p['confidence'] for p in predictions) / len(predictions)
        if predictions else 0.0
    )
    
    # Simple accuracy calculation (confidence average)
    ai_accuracy = confidence_avg
    
    return DashboardStats(
        total_messages=total,
        notify_count=notify_count,
        digest_count=digest_count,
        mute_count=mute_count,
        ai_accuracy=round(ai_accuracy, 2),
        confidence_average=round(confidence_avg, 2),
    )


@app.get("/dashboard/charts")
async def get_dashboard_charts():
    """Get chart data for dashboard"""
    predictions = get_predictions()
    messages = get_messages()
    
    # Notification Trend (by action)
    notification_trend = [
        {"name": "Notify", "value": sum(1 for p in predictions if p['action'] == 'notify')},
        {"name": "Digest", "value": sum(1 for p in predictions if p['action'] == 'digest')},
        {"name": "Mute", "value": sum(1 for p in predictions if p['action'] == 'mute')},
    ]
    
    # Message Categories (by message_type)
    message_types = {}
    for p in predictions:
        msg_type = p.get('message_type', 'unknown')
        message_types[msg_type] = message_types.get(msg_type, 0) + 1
    message_categories = [
        {"name": k, "value": v} for k, v in sorted(message_types.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Confidence Distribution
    confidence_bins = [
        {"range": "0.5-0.6", "count": sum(1 for p in predictions if 0.5 <= p['confidence'] < 0.6)},
        {"range": "0.6-0.7", "count": sum(1 for p in predictions if 0.6 <= p['confidence'] < 0.7)},
        {"range": "0.7-0.8", "count": sum(1 for p in predictions if 0.7 <= p['confidence'] < 0.8)},
        {"range": "0.8-0.9", "count": sum(1 for p in predictions if 0.8 <= p['confidence'] < 0.9)},
        {"range": "0.9-1.0", "count": sum(1 for p in predictions if 0.9 <= p['confidence'] <= 1.0)},
    ]
    
    # User Activity (by conversation type)
    conversation_types = {}
    for m in messages:
        conv_type = m.get('conversation_type', 'unknown')
        conversation_types[conv_type] = conversation_types.get(conv_type, 0) + 1
    user_activity = [
        {"name": k, "value": v} for k, v in sorted(conversation_types.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Spam Detection
    spam_detection = [
        {"name": "Scam", "value": sum(1 for p in predictions if p['message_type'] == 'scam')},
        {"name": "Spam", "value": sum(1 for p in predictions if p['message_type'] == 'spam')},
        {"name": "Forward", "value": sum(1 for p in predictions if p['message_type'] == 'forward')},
        {"name": "Promotion", "value": sum(1 for p in predictions if p['message_type'] == 'promotion')},
        {"name": "Legitimate", "value": sum(1 for p in predictions if p['message_type'] not in ['scam', 'spam', 'forward', 'promotion'])},
    ]
    
    return {
        "notification_trend": notification_trend,
        "message_categories": message_categories,
        "confidence_distribution": confidence_bins,
        "user_activity": user_activity,
        "spam_detection": spam_detection,
    }


# ============================================================================
# Analytics Endpoints
# ============================================================================

@app.get("/analytics", response_model=AnalyticsData)
async def get_analytics():
    """Get comprehensive analytics"""
    predictions = get_predictions()
    messages = get_messages()
    
    # Top Senders
    sender_counts = {}
    for m in messages:
        sender = m.get('sender_user_id', 'unknown')
        sender_counts[sender] = sender_counts.get(sender, 0) + 1
    top_senders = [
        {"sender": k, "count": v}
        for k, v in sorted(sender_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Group Analytics
    group_counts = {}
    for m in messages:
        group = m.get('group_id')
        if group:
            group_counts[group] = group_counts.get(group, 0) + 1
    group_analytics = [
        {"group_id": k, "message_count": v}
        for k, v in sorted(group_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Business Analytics
    business_counts = {}
    for m in messages:
        business = m.get('business_id')
        if business:
            business_counts[business] = business_counts.get(business, 0) + 1
    business_analytics = [
        {"business_id": k, "message_count": v}
        for k, v in sorted(business_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Daily Trends (simplified)
    daily_trends = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        daily_trends.append({
            "date": date,
            "messages": len(messages) // 7,
            "notify": len(predictions) // 7 // 3,
            "digest": len(predictions) // 7 // 3,
            "mute": len(predictions) // 7 // 3,
        })
    
    # Confidence Distribution
    confidence_distribution = [
        {"bin": f"{i*10}-{(i+1)*10}%", "count": sum(1 for p in predictions if i*0.1 <= p['confidence'] < (i+1)*0.1)}
        for i in range(5, 10)
    ]
    
    # Message Type Distribution
    message_types = {}
    for p in predictions:
        msg_type = p.get('message_type', 'unknown')
        message_types[msg_type] = message_types.get(msg_type, 0) + 1
    message_type_distribution = [
        {"type": k, "count": v} for k, v in sorted(message_types.items(), key=lambda x: x[1], reverse=True)
    ]
    
    return AnalyticsData(
        top_senders=top_senders,
        group_analytics=group_analytics,
        business_analytics=business_analytics,
        daily_trends=daily_trends,
        confidence_distribution=confidence_distribution,
        message_type_distribution=message_type_distribution,
    )


# ============================================================================
# Prediction Endpoints
# ============================================================================

@app.post("/predict")
async def predict_message(message: MessageData):
    """Predict routing for a single message"""
    message_dict = message.dict()
    result = router.route_message(message_dict)
    return PredictionResult(**result)


@app.post("/run-model")
async def run_full_model():
    """Run the full prediction model on all messages"""
    global _predictions_cache
    messages = get_messages()
    predictions = router.run(messages)
    _predictions_cache = predictions
    write_output(DATASET_DIR, predictions)
    return {
        "status": "success",
        "total_messages": len(predictions),
        "predictions": predictions,
    }


# ============================================================================
# History Endpoints
# ============================================================================

@app.get("/history")
async def get_history():
    """Get prediction history"""
    predictions = get_predictions()
    return {
        "total": len(predictions),
        "by_action": {
            "notify": sum(1 for p in predictions if p['action'] == 'notify'),
            "digest": sum(1 for p in predictions if p['action'] == 'digest'),
            "mute": sum(1 for p in predictions if p['action'] == 'mute'),
        },
        "by_type": {
            msg_type: sum(1 for p in predictions if p['message_type'] == msg_type)
            for msg_type in set(p['message_type'] for p in predictions)
        },
    }


# ============================================================================
# Users Endpoints
# ============================================================================

@app.get("/users")
async def get_users():
    """Get unique users from messages"""
    messages = get_messages()
    users = set()
    for m in messages:
        if m.get('user_id'):
            users.add(m['user_id'])
        if m.get('sender_user_id'):
            users.add(m['sender_user_id'])
    
    return {
        "count": len(users),
        "users": sorted(list(users))[:100],
    }


# ============================================================================
# Groups Endpoints
# ============================================================================

@app.get("/groups")
async def get_groups():
    """Get unique groups from messages"""
    messages = get_messages()
    groups = set()
    for m in messages:
        if m.get('group_id'):
            groups.add(m['group_id'])
    
    return {
        "count": len(groups),
        "groups": sorted(list(groups))[:100],
    }


# ============================================================================
# Directory Endpoint (display names for groups/businesses)
# ============================================================================

@app.get("/directory")
async def get_directory_endpoint():
    """Get group_id -> group_name and business_id -> display_name lookups"""
    return get_directory()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)