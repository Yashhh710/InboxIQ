import re
from typing import Dict, Any, List, Tuple, Optional


class UserProfileEngine:
    def __init__(self, context):
        self.context = context

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.context.users.get(user_id)

    def is_in_quiet_hours(self, user_id: str, created_at: str) -> bool:
        user = self.get_user(user_id)
        if not user:
            return False
        dnd = user.get('do_not_disturb_window', '')
        if not dnd:
            return False
        parts = dnd.split('-')
        if len(parts) != 2:
            return False
        start_str, end_str = parts
        try:
            created_time = created_at.split(' ')[1] if ' ' in created_at else ''
            if not created_time:
                return False
            hh, mm = created_time.split(':')[:2]
            cur_minutes = int(hh) * 60 + int(mm)
            sh, sm = start_str.split(':')
            eh, em = end_str.split(':')
            start_min = int(sh) * 60 + int(sm)
            end_min = int(eh) * 60 + int(em)
            if start_min <= end_min:
                return start_min <= cur_minutes <= end_min
            else:
                return cur_minutes >= start_min or cur_minutes <= end_min
        except:
            return False

    def get_engagement_score(self, user_id: str) -> float:
        user = self.get_user(user_id)
        if not user:
            return 0.5
        opened = int(user.get('messages_opened_30d', '0') or 0)
        replied = int(user.get('messages_replied_30d', '0') or 0)
        dismissed = int(user.get('notifications_dismissed_30d', '0') or 0)
        reported = int(user.get('messages_reported_30d', '0') or 0)
        total = opened + dismissed + 1
        positive = opened + replied * 2
        negative = dismissed * 2 + reported * 5
        score = (positive - negative + total) / (total * 3)
        return max(0.0, min(1.0, score))

    def get_dismissal_rate(self, user_id: str) -> float:
        user = self.get_user(user_id)
        if not user:
            return 0.3
        opened = int(user.get('messages_opened_30d', '0') or 0)
        dismissed = int(user.get('notifications_dismissed_30d', '0') or 0)
        total = opened + dismissed
        if total == 0:
            return 0.3
        return dismissed / total

    def get_report_rate(self, user_id: str) -> float:
        user = self.get_user(user_id)
        if not user:
            return 0.0
        reported = int(user.get('messages_reported_30d', '0') or 0)
        opened = int(user.get('messages_opened_30d', '0') or 0)
        total = max(1, opened)
        return reported / total
