import re
from typing import Dict, Any, List, Tuple, Optional
from collections import defaultdict


class HistoryEngine:
    def __init__(self, context):
        self.context = context
        self._similarity_cache = {}

    def get_event(self, message_id: str) -> Optional[Dict[str, Any]]:
        return self.context.message_events.get(message_id)

    def get_user_history(self, user_id: str) -> List[Dict[str, Any]]:
        return self.context.history_by_user.get(user_id, [])

    def get_group_history(self, group_id: str) -> List[Dict[str, Any]]:
        return self.context.history_by_group.get(group_id, [])

    def get_business_history(self, business_id: str) -> List[Dict[str, Any]]:
        return self.context.history_by_business.get(business_id, [])

    def get_sender_history(self, sender_user_id: str) -> List[Dict[str, Any]]:
        return self.context.history_by_sender_user.get(sender_user_id, [])

    def _text_similarity(self, text1: str, text2: str) -> float:
        if not text1 or not text2:
            return 0.0
        t1 = text1.lower()
        t2 = text2.lower()
        if t1 == t2:
            return 1.0
        words1 = set(re.findall(r'\w+', t1))
        words2 = set(re.findall(r'\w+', t2))
        if not words1 or not words2:
            return 0.0
        common = words1 & words2
        union = words1 | words2
        jaccard = len(common) / len(union) if union else 0
        short_words1 = {w for w in words1 if len(w) > 3}
        short_words2 = {w for w in words2 if len(w) > 3}
        short_common = short_words1 & short_words2
        short_union = short_words1 | short_words2
        short_jaccard = len(short_common) / len(short_union) if short_union else 0
        return max(jaccard, short_jaccard * 1.2)

    def find_similar_messages(
        self,
        target_text: str,
        user_id: str,
        threshold: float = 0.55,
        limit: int = 5,
        group_id: str = '',
        business_id: str = '',
        sender_user_id: str = '',
    ) -> List[Tuple[float, Dict[str, Any], Optional[Dict[str, Any]]]]:
        candidates = []
        for msg in self.get_user_history(user_id):
            candidates.append(msg)
        if group_id:
            for msg in self.get_group_history(group_id):
                candidates.append(msg)
        if business_id:
            for msg in self.get_business_history(business_id):
                candidates.append(msg)
        if sender_user_id:
            for msg in self.get_sender_history(sender_user_id):
                candidates.append(msg)
        seen = set()
        scored = []
        for msg in candidates:
            mid = msg['message_id']
            if mid in seen:
                continue
            seen.add(mid)
            sim = self._text_similarity(target_text, msg.get('message_text', ''))
            fc = int(msg.get('forwarded_count', '0') or 0)
            fwd_match = 0
            target_msg_text = target_text or ''
            if fc > 5 and (target_msg_text and int(0) > 5 if False else False):
                pass
            if group_id and msg.get('group_id') == group_id:
                sim += 0.1
            if business_id and msg.get('business_id') == business_id:
                sim += 0.1
            if sender_user_id and msg.get('sender_user_id') == sender_user_id:
                sim += 0.1
            scored.append((sim, msg))
        scored.sort(key=lambda x: -x[0])
        result = []
        for sim, msg in scored[:limit * 3]:
            if sim < threshold:
                continue
            event = self.get_event(msg['message_id'])
            result.append((sim, msg, event))
            if len(result) >= limit:
                break
        return result

    def find_pattern_ignored_by_user(
        self,
        user_id: str,
        group_id: str = '',
        business_id: str = '',
        sender_user_id: str = '',
        limit: int = 3,
    ) -> List[Dict[str, Any]]:
        results = []
        history = self.get_user_history(user_id)
        for msg in history:
            if group_id and msg.get('group_id') != group_id:
                continue
            if business_id and msg.get('business_id') != business_id:
                continue
            if sender_user_id and msg.get('sender_user_id') != sender_user_id:
                continue
            event = self.get_event(msg['message_id'])
            if event:
                dismissed = event.get('notification_dismissed') in ('1', 1, True)
                muted = event.get('muted_after_message') in ('1', 1, True)
                reported = event.get('message_reported') in ('1', 1, True)
                not_opened = event.get('message_opened') in ('0', 0, False)
                not_replied = event.get('message_replied') in ('0', 0, False)
                if dismissed or muted or reported or (not_opened and not_replied):
                    results.append(msg)
                    if len(results) >= limit:
                        break
        return results

    def find_pattern_engaged_by_user(
        self,
        user_id: str,
        group_id: str = '',
        business_id: str = '',
        sender_user_id: str = '',
        limit: int = 3,
    ) -> List[Dict[str, Any]]:
        results = []
        history = self.get_user_history(user_id)
        for msg in history:
            if group_id and msg.get('group_id') != group_id:
                continue
            if business_id and msg.get('business_id') != business_id:
                continue
            if sender_user_id and msg.get('sender_user_id') != sender_user_id:
                continue
            event = self.get_event(msg['message_id'])
            if event:
                opened = event.get('message_opened') in ('1', 1, True)
                replied = event.get('message_replied') in ('1', 1, True)
                reaction = event.get('reaction_time_minutes', '')
                if reaction and str(reaction).strip():
                    try:
                        rt = int(reaction)
                        if rt <= 10:
                            opened = True
                    except:
                        pass
                if opened or replied:
                    results.append(msg)
                    if len(results) >= limit:
                        break
        return results

    def count_forwarded_from_sender(self, sender_user_id: str, user_id: str) -> int:
        count = 0
        history = self.get_user_history(user_id)
        for msg in history:
            if msg.get('sender_user_id') == sender_user_id:
                fc = int(msg.get('forwarded_count', '0') or 0)
                if fc >= 5:
                    count += 1
        return count

    def get_evidence_ids(
        self,
        target_text: str,
        user_id: str,
        group_id: str = '',
        business_id: str = '',
        sender_user_id: str = '',
        limit: int = 2,
    ) -> str:
        similar = self.find_similar_messages(
            target_text, user_id,
            threshold=0.45,
            limit=limit,
            group_id=group_id,
            business_id=business_id,
            sender_user_id=sender_user_id,
        )
        ids = []
        for sim, msg, event in similar:
            ids.append(msg['message_id'])
        if not ids:
            ignored = self.find_pattern_ignored_by_user(
                user_id, group_id=group_id, business_id=business_id,
                sender_user_id=sender_user_id, limit=limit,
            )
            ids = [m['message_id'] for m in ignored]
        if not ids:
            engaged = self.find_pattern_engaged_by_user(
                user_id, group_id=group_id, business_id=business_id,
                sender_user_id=sender_user_id, limit=limit,
            )
            ids = [m['message_id'] for m in engaged]
        if ids:
            return ';'.join(ids[:limit])
        return 'none'

    def get_sender_behavior_profile(
        self,
        user_id: str,
        sender_user_id: str,
    ) -> Dict[str, Any]:
        total = 0
        opened = 0
        dismissed = 0
        muted = 0
        reported = 0
        replied = 0
        high_forward = 0
        history = self.get_user_history(user_id)
        for msg in history:
            if msg.get('sender_user_id') != sender_user_id:
                continue
            total += 1
            fc = int(msg.get('forwarded_count', '0') or 0)
            if fc >= 5:
                high_forward += 1
            event = self.get_event(msg['message_id'])
            if event:
                if event.get('message_opened') in ('1', 1):
                    opened += 1
                if event.get('message_replied') in ('1', 1):
                    replied += 1
                if event.get('notification_dismissed') in ('1', 1):
                    dismissed += 1
                if event.get('muted_after_message') in ('1', 1):
                    muted += 1
                if event.get('message_reported') in ('1', 1):
                    reported += 1
        return {
            'total': total,
            'opened': opened,
            'replied': replied,
            'dismissed': dismissed,
            'muted': muted,
            'reported': reported,
            'high_forward': high_forward,
            'engagement_rate': opened / total if total else 0.5,
            'negative_rate': (dismissed + muted + reported) / total if total else 0.0,
            'high_forward_rate': high_forward / total if total else 0.0,
        }
