import re
from typing import Dict, Any, List, Tuple, Optional


class ConfidenceEngine:
    def __init__(
        self,
        context,
        user_profile,
        group_engine,
        business_engine,
        history_engine,
    ):
        self.context = context
        self.user_profile = user_profile
        self.group_engine = group_engine
        self.business_engine = business_engine
        self.history_engine = history_engine

    def compute(
        self,
        decision: Dict[str, Any],
    ) -> float:
        action = decision['action']
        msg_type = decision['message_type']
        reason_hint = decision.get('reason_hint', '')
        scam = decision.get('scam_result', {})
        spam = decision.get('spam_result', {})
        media = decision.get('media', {})
        message = decision.get('message', {})

        base = 0.6
        score = base

        if action == 'mute':
            if scam.get('is_scam'):
                rs = scam.get('risk_score', 0)
                score = 0.6 + min(0.35, rs * 0.5)
                if msg_type == 'scam' and scam.get('scam_type'):
                    score += 0.05
            elif spam.get('is_spam'):
                ss = spam.get('spam_score', 0)
                score = 0.6 + min(0.3, ss * 0.5)
                fc = int(message.get('forwarded_count', '0') or 0)
                if fc >= 10:
                    score += 0.05
                if spam.get('is_chain_message'):
                    score += 0.05
            elif reason_hint in ('promotion_opted_out', 'opted_out_business'):
                score = 0.88
            elif reason_hint in ('promotion_dismissed_history', 'spam_ignored'):
                score = 0.82
            elif reason_hint == 'router_override':
                score = 0.95
            else:
                score = 0.72
        elif action == 'notify':
            if reason_hint in ('trusted_admin_time_sensitive', 'trusted_admin_same_day_update',
                               'work_context_deadline'):
                score = 0.9
            elif reason_hint in ('direct_personal_urgent', 'direct_personal_request',
                                 'personal_mention', 'mentioned_group', 'mentioned_in_group'):
                score = 0.85
            elif reason_hint in ('payment_urgent', 'payment_reminder_verified'):
                score = 0.87
            elif reason_hint in ('trusted_business_time_sensitive', 'trusted_business_urgent'):
                score = 0.82
            elif reason_hint in ('media_urgent', 'media_event_urgent', 'media_business_urgent'):
                score = 0.78
            else:
                score = 0.72
        else:
            if reason_hint in ('useful_group_info', 'verified_business_update',
                               'non_urgent_personal', 'harmless_greeting'):
                score = 0.82
            elif reason_hint in ('promotion_opted_in', 'forwarded_content'):
                score = 0.8
            elif reason_hint in ('payment_reminder', 'muted_group_info', 'muted_group_urgent'):
                score = 0.8
            else:
                score = 0.7

        user_id = message.get('user_id', '')
        group_id = message.get('group_id', '')
        business_id = message.get('business_id', '')
        sender_user_id = message.get('sender_user_id', '')

        context_strength = 0
        if group_id and self.group_engine.get_group(group_id):
            context_strength += 1
        if business_id and self.business_engine.get_business(business_id):
            context_strength += 1
        if user_id and self.user_profile.get_user(user_id):
            context_strength += 1
        if sender_user_id:
            rel_profile = self.history_engine.get_sender_behavior_profile(user_id, sender_user_id)
            if rel_profile['total'] >= 1:
                context_strength += 1
        score += min(0.05, context_strength * 0.015)

        text = message.get('message_text', '') or ''
        text = text.strip()
        if not text:
            if media.get('has_media'):
                importance = media.get('importance', 0.5)
                score = 0.45 + importance * 0.35
            else:
                score = max(0.5, score - 0.15)

        evidence = decision.get('evidence_ids', 'none')
        if evidence and evidence != 'none':
            evidence_count = len([e for e in evidence.split(';') if e])
            score += min(0.04, evidence_count * 0.02)

        if msg_type in ('scam', 'forward', 'greeting', 'promotion', 'payment', 'urgent'):
            score += 0.02
        if msg_type == 'unknown':
            score -= 0.05

        if msg_type in ('scam', 'spam'):
            if action != 'mute':
                score -= 0.1

        score = max(0.5, min(0.97, score))
        return round(score, 2)
