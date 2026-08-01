import re
from typing import Dict, Any, List, Tuple, Optional


class BusinessEngine:
    def __init__(self, context):
        self.context = context

    def get_business(self, business_id: str) -> Optional[Dict[str, Any]]:
        return self.context.business_accounts.get(business_id)

    def get_user_business_relation(self, user_id: str, business_id: str) -> Optional[Dict[str, Any]]:
        return self.context.user_business_history.get((user_id, business_id))

    def is_verified(self, business_id: str) -> bool:
        b = self.get_business(business_id)
        if not b:
            return False
        return b.get('verified', '0') in ('1', 1, True, 'true', 'True')

    def has_domain_mismatch(self, business_id: str) -> bool:
        b = self.get_business(business_id)
        if not b:
            return False
        official = (b.get('official_domain') or '').strip().lower()
        used = (b.get('domain_used_by_sender') or '').strip().lower()
        if not official:
            return bool(used)
        if not used:
            return False
        return official != used

    def is_suspicious_business(self, business_id: str) -> bool:
        b = self.get_business(business_id)
        if not b:
            return False
        if not self.is_verified(business_id):
            account_age = int(b.get('account_age_days', '9999') or 9999)
            domain_age = int(b.get('domain_used_by_sender_age_days', '9999') or 9999)
            reports = int(b.get('user_reports_30d', '0') or 0)
            if account_age < 60 or domain_age < 60:
                return True
            if reports > 30:
                return True
            if self.has_domain_mismatch(business_id):
                return True
        return False

    def get_business_risk(self, business_id: str) -> Dict[str, Any]:
        b = self.get_business(business_id)
        if not b:
            return {'risk_score': 0.5, 'verified': False, 'suspicious': True}
        verified = self.is_verified(business_id)
        suspicious = self.is_suspicious_business(business_id)
        reports = int(b.get('user_reports_30d', '0') or 0)
        risk_score = 0.0
        if not verified:
            risk_score += 0.4
        if suspicious:
            risk_score += 0.3
        if reports > 50:
            risk_score += 0.2
        elif reports > 20:
            risk_score += 0.1
        if self.has_domain_mismatch(business_id):
            risk_score += 0.2
        risk_score = min(1.0, risk_score)
        return {
            'risk_score': risk_score,
            'verified': verified,
            'suspicious': suspicious,
            'reports': reports,
            'category': b.get('category', 'unknown'),
            'domain_mismatch': self.has_domain_mismatch(business_id),
        }

    def has_user_opted_out(self, user_id: str, business_id: str) -> bool:
        rel = self.get_user_business_relation(user_id, business_id)
        if not rel:
            return False
        opted_out = rel.get('promotions_opted_out_at', '')
        return bool(opted_out and str(opted_out).strip())

    def allows_promotions(self, user_id: str, business_id: str) -> bool:
        rel = self.get_user_business_relation(user_id, business_id)
        if not rel:
            return False
        allows = rel.get('allows_promotions', '0')
        return allows in ('1', 1, True, 'true', 'True')

    def get_user_business_dismissal_rate(self, user_id: str, business_id: str) -> float:
        rel = self.get_user_business_relation(user_id, business_id)
        if not rel:
            return 0.5
        opened = int(rel.get('messages_opened_30d', '0') or 0)
        dismissed = int(rel.get('messages_dismissed_30d', '0') or 0)
        total = opened + dismissed
        if total == 0:
            return 0.5
        return dismissed / total

    def has_active_relationship(self, user_id: str, business_id: str) -> bool:
        rel = self.get_user_business_relation(user_id, business_id)
        if not rel:
            return False
        activity = int(rel.get('activity_count_180d', '0') or 0)
        last_reply = rel.get('last_reply_at', '')
        why = rel.get('why_user_knows_account', '')
        active_indicators = [
            'active_', 'recent_', 'delivery_expected_today',
            'confirmed_', 'upcoming_', 'frequent_',
            'registered_for_', 'ride_booked_today', 'monthly_',
            'prescription_', 'society_payment', 'loan_', 'payment_stack_interest',
            'trading_', 'caregiver_', 'order_', 'booking_', 'appointment_',
            'shopee_return', 'new_food_delivery_signup', 'workshop', 'event_',
            'alumni_event', 'dance_class', 'hotel_booking', 'restaurant_reservation',
            'traffic_challan', 'vehicle_insurance', 'vehicle_service',
            'security_webinar_registration', 'education_survey',
            'land_listing_watchlist', 'book_adaptation_watchlist',
            'cashback_wallet', 'coupon_membership', 'old_sale_subscription',
            'old_delivery_order', 'abandoned_travel_search', 'old_credit_card',
            'old_retail_coupon_list', 'travel_package_interest',
            'saved_travel_search',
        ]
        if activity > 0:
            return True
        for indicator in active_indicators:
            if indicator in why:
                return True
        if last_reply:
            return True
        return False

    def get_relationship_strength(self, user_id: str, business_id: str) -> float:
        rel = self.get_user_business_relation(user_id, business_id)
        if not rel:
            return 0.0
        activity = int(rel.get('activity_count_180d', '0') or 0)
        opened = int(rel.get('messages_opened_30d', '0') or 0)
        replied = int(rel.get('messages_replied_30d', '0') or 0)
        dismissed = int(rel.get('messages_dismissed_30d', '0') or 0)
        opted_out = self.has_user_opted_out(user_id, business_id)
        active = self.has_active_relationship(user_id, business_id)
        score = 0.0
        if active:
            score += 0.4
        score += min(0.2, activity * 0.01)
        total = opened + dismissed + 1
        score += (opened + replied * 2) / (total * 3) * 0.3
        if opted_out:
            score *= 0.3
        if self.allows_promotions(user_id, business_id):
            score = min(1.0, score + 0.1)
        return min(1.0, score)
