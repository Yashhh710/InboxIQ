import re
from typing import Dict, Any, List, Tuple, Optional


class GroupEngine:
    def __init__(self, context):
        self.context = context

    def get_group(self, group_id: str) -> Optional[Dict[str, Any]]:
        return self.context.groups.get(group_id)

    def get_group_member(self, group_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        return self.context.group_members.get((group_id, user_id))

    def is_group_muted(self, group_id: str, user_id: str) -> bool:
        gm = self.get_group_member(group_id, user_id)
        if not gm:
            return False
        return gm.get('group_muted_by_user', '0') in ('1', 1, True, 'true', 'True')

    def is_admin(self, group_id: str, user_id: str) -> bool:
        gm = self.get_group_member(group_id, user_id)
        if not gm:
            return False
        return gm.get('role', '') == 'admin'

    def is_sender_admin(self, group_id: str, sender_user_id: str) -> bool:
        return self.is_admin(group_id, sender_user_id)

    def get_group_type(self, group_id: str) -> str:
        g = self.get_group(group_id)
        if not g:
            return 'unknown'
        return g.get('group_type', 'unknown')

    def get_member_activity_score(self, group_id: str, user_id: str) -> float:
        gm = self.get_group_member(group_id, user_id)
        if not gm:
            return 0.5
        sent = int(gm.get('messages_sent_30d', '0') or 0)
        read = int(gm.get('messages_read_30d', '0') or 0)
        replies = int(gm.get('replies_sent_30d', '0') or 0)
        dismissed = int(gm.get('notifications_dismissed_30d', '0') or 0)
        total = read + dismissed + 1
        active = sent + replies + read * 0.5
        score = active / (total * 2)
        return max(0.0, min(1.0, score))

    def get_group_dismissal_rate(self, group_id: str, user_id: str) -> float:
        gm = self.get_group_member(group_id, user_id)
        if not gm:
            return 0.3
        read = int(gm.get('messages_read_30d', '0') or 0)
        dismissed = int(gm.get('notifications_dismissed_30d', '0') or 0)
        total = read + dismissed
        if total == 0:
            return 0.3
        return dismissed / total

    def get_group_importance(self, group_id: str, user_id: str) -> Dict[str, Any]:
        gtype = self.get_group_type(group_id)
        importance_scores = {
            'society': 0.8,
            'school_group': 0.85,
            'coworker': 0.8,
            'family': 0.75,
            'extended_family': 0.6,
            'friends': 0.65,
            'alumni': 0.5,
            'marketplace': 0.45,
            'local_food': 0.5,
            'book_club': 0.45,
            'dance_class': 0.6,
            'caregiving': 0.85,
            'sports': 0.5,
            'finance_help': 0.7,
            'safety': 0.9,
            'investment_tips': 0.55,
            'real_estate': 0.5,
            'college_faculty': 0.75,
            'college_students': 0.7,
            'tech_community': 0.65,
        }
        base_score = importance_scores.get(gtype, 0.5)
        if self.is_group_muted(group_id, user_id):
            base_score *= 0.5
        gm = self.get_group_member(group_id, user_id)
        if gm:
            activity = self.get_member_activity_score(group_id, user_id)
            base_score = base_score * 0.7 + activity * 0.3
        return {
            'group_type': gtype,
            'importance': base_score,
            'muted': self.is_group_muted(group_id, user_id),
            'is_member_admin': self.is_admin(group_id, user_id),
        }

    def is_high_priority_group_type(self, group_id: str) -> bool:
        gtype = self.get_group_type(group_id)
        return gtype in ('society', 'school_group', 'coworker', 'safety', 'caregiving',
                         'college_faculty', 'college_students')
