import os
import sys
from typing import Dict, Any, List, Tuple, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engines.context_loader import ContextLoader, load_messages, write_output
from engines.user_profile import UserProfileEngine
from engines.group_engine import GroupEngine
from engines.business_engine import BusinessEngine
from engines.history_engine import HistoryEngine
from engines.media_analyzer import MediaAnalyzer
from engines.scam_detector import ScamDetector
from engines.spam_detector import SpamDetector
from engines.reasoning_engine import ReasoningEngine
from engines.confidence_engine import ConfidenceEngine


class NotificationRouter:
    def __init__(self, dataset_dir: str):
        self.dataset_dir = dataset_dir
        self.context_loader = ContextLoader(dataset_dir)
        self.context = None
        self.user_profile = None
        self.group_engine = None
        self.business_engine = None
        self.history_engine = None
        self.media_analyzer = None
        self.scam_detector = None
        self.spam_detector = None
        self.reasoning_engine = None
        self.confidence_engine = None
        self._initialized = False

    def initialize(self):
        if self._initialized:
            return
        self.context = self.context_loader.load()
        self.user_profile = UserProfileEngine(self.context)
        self.group_engine = GroupEngine(self.context)
        self.business_engine = BusinessEngine(self.context)
        self.history_engine = HistoryEngine(self.context)
        self.media_analyzer = MediaAnalyzer(self.dataset_dir, self.context)
        self.scam_detector = ScamDetector(self.context, self.business_engine)
        self.spam_detector = SpamDetector(self.context, self.business_engine, self.history_engine)
        self.reasoning_engine = ReasoningEngine(
            self.context,
            self.user_profile,
            self.group_engine,
            self.business_engine,
            self.history_engine,
            self.media_analyzer,
            self.scam_detector,
            self.spam_detector,
        )
        self.confidence_engine = ConfidenceEngine(
            self.context,
            self.user_profile,
            self.group_engine,
            self.business_engine,
            self.history_engine,
        )
        self._initialized = True

    def route_message(self, message: Dict[str, Any]) -> Dict[str, Any]:
        self.initialize()
        decision = self.reasoning_engine.reason(message)
        confidence = self.confidence_engine.compute(decision)
        return {
            'message_id': message['message_id'],
            'action': decision['action'],
            'message_type': decision['message_type'],
            'reason': decision['reason'],
            'confidence': confidence,
            'evidence_message_ids': decision['evidence_ids'],
        }

    def run(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        self.initialize()
        results = []
        for msg in messages:
            result = self.route_message(msg)
            results.append(result)
        return results

    def generate_output(self) -> List[Dict[str, Any]]:
        self.initialize()
        messages = load_messages(self.dataset_dir)
        predictions = self.run(messages)
        write_output(self.dataset_dir, predictions)
        return predictions
