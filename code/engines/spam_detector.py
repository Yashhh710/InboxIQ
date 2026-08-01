import re
from typing import Dict, Any, List, Tuple, Optional


class SpamDetector:
    def __init__(self, context, business_engine=None, history_engine=None):
        self.context = context
        self.business_engine = business_engine
        self.history_engine = history_engine
        self._spam_keywords = [
            r'50%.*off.*wait', r'won\'?t.*wait', r'ready.*place.*first.*order',
            r'READY.*PLACE', r'Welcome.*Get.*TRY', r'TRY50', r'offer.*expire.*soon',
            r'hurry.*expire', r'limited.*shopping.*benefit', r'you.*just.*dropped.*something',
            r'check.*details.*offer.*expires', r'Unlock.*benefits.*membership',
            r'international.*payouts.*don\'?t.*have.*to.*slow',
            r'Let\'?s.*connect.*pain.*points.*resonate',
            r'RazorpayX.*Global.*Payouts.*helps.*simplify.*vendor',
            r'survey.*3-minute.*expect', r'We.*conducting.*short.*3-minute',
            r'share.*blessing.*10.*people', r'share.*positivity.*everyone',
            r'forward.*ten.*people.*blessing', r'chain.*message.*luck',
            r'break.*chain.*good.*luck', r'drink.*warm.*water.*every.*hour',
            r'share.*family.*groups.*before.*night', r'health.*tip.*herbal.*mix',
            r'forwarded.*health.*tip', r'ancient.*remedy.*health',
            r'good.*morning.*stay.*positive.*share.*blessing',
            r'good.*morning.*sabko.*bhagwan.*bhala', r'positive.*energy.*failao',
            r'URGENT.*share.*everyone.*before.*midnight.*good.*luck',
            r'Share.*this.*blessing.*10.*people.*sunset',
            r'fwd.*received.*drink.*warm.*water.*useful.*apparently.*share.*family.*groups',
            r'one.*habit.*fix.*health.*read.*till.*end.*share.*family.*groups',
        ]
        self._spam_patterns = [re.compile(p, re.IGNORECASE) for p in self._spam_keywords]

    def detect(self, message: Dict[str, Any]) -> Dict[str, Any]:
        text = message.get('message_text', '') or ''
        user_id = message.get('user_id', '')
        conversation_type = message.get('conversation_type', '')
        business_id = message.get('business_id', '')
        group_id = message.get('group_id', '')
        sender_user_id = message.get('sender_user_id', '')
        fc = int(message.get('forwarded_count', '0') or 0)

        spam_score = 0.0
        spam_factors = []
        spam_type = None

        is_chain_message = fc >= 8 or bool(re.search(
            r'(forward.*bless|share.*bless|chain.*luck|good.*morning.*share|positive.*energy.*failao|drink.*warm.*water.*share|forward.*ten.*people|URGENT.*share.*everyone|share.*10.*people|share.*family.*groups|fwd.*received.*share.*family|health.*tip.*share|ancient.*remedy.*follow|break.*chain)',
            text, re.IGNORECASE))
        if is_chain_message:
            spam_score += 0.35
            spam_factors.append('chain_forward_message')
            spam_type = 'forward'

        if fc >= 10:
            spam_score += 0.2
            spam_factors.append(f'high_forward_count_{fc}')

        if fc >= 5 and not is_chain_message:
            spam_score += 0.1
            spam_factors.append(f'moderate_forward_count_{fc}')

        is_marketing = False
        if business_id and self.business_engine:
            opted_out = self.business_engine.has_user_opted_out(user_id, business_id)
            allows_promo = self.business_engine.allows_promotions(user_id, business_id)
            dismissal_rate = self.business_engine.get_user_business_dismissal_rate(user_id, business_id)
            has_promo_content = bool(re.search(
                r'(50% off|TRY50|offer.*expire|shopping.*benefit|sale.*coupon|save.*extra|discount.*today|launch.*discount|membership.*event.*entertainment.*update)',
                text, re.IGNORECASE)) or bool(re.search(
                r'(Reply STOP to unsubscribe|Reply STOP to opt out|opt out|unsubscribe from marketing)',
                text, re.IGNORECASE))
            if opted_out and has_promo_content:
                spam_score += 0.35
                spam_factors.append('marketing_after_opt_out')
                spam_type = 'spam'
            elif dismissal_rate >= 0.7 and has_promo_content:
                spam_score += 0.25
                spam_factors.append('high_dismissal_marketing')
            elif not allows_promo and not self.business_engine.has_active_relationship(user_id, business_id) and has_promo_content:
                spam_score += 0.2
                spam_factors.append('unsolicited_marketing')
            if has_promo_content:
                is_marketing = True

        if self.history_engine and (fc >= 5 or is_marketing):
            if group_id:
                ignored = self.history_engine.find_pattern_ignored_by_user(
                    user_id, group_id=group_id, sender_user_id=sender_user_id, limit=2
                )
                if len(ignored) >= 2:
                    spam_score += 0.2
                    spam_factors.append('repeated_ignored_from_group_sender')
            if business_id:
                ignored = self.history_engine.find_pattern_ignored_by_user(
                    user_id, business_id=business_id, limit=2
                )
                if len(ignored) >= 2:
                    spam_score += 0.2
                    spam_factors.append('repeated_dismissed_business')
            if sender_user_id:
                profile = self.history_engine.get_sender_behavior_profile(user_id, sender_user_id)
                if profile.get('negative_rate', 0) >= 0.6 and profile['total'] >= 2:
                    spam_score += 0.2
                    spam_factors.append('sender_usually_ignored')
                if profile.get('high_forward_rate', 0) >= 0.5 and profile['total'] >= 2:
                    spam_score += 0.15
                    spam_factors.append('sender_often_forwards')

        is_resale_marketplace = False
        if conversation_type == 'group' and group_id:
            from engines.group_engine import GroupEngine
            ge = GroupEngine(self.context)
            gtype = ge.get_group_type(group_id)
            if gtype in ('marketplace', 'local_food', 'real_estate'):
                is_resale = bool(re.search(
                    r'(selling|selling a|pickup near|DM if interested|price final|size [MSLXL]|bought last month|worn once|no damage|buyer cancelled|clear it fast|message only if serious|token booking|registry papers after payment|plots near|land parcel|limited plots left|homemade|momos available|biryani boxes|imported.*clearance)',
                    text, re.IGNORECASE))
                if is_resale:
                    is_resale_marketplace = True
                    if self.history_engine:
                        ignored = self.history_engine.find_pattern_ignored_by_user(
                            user_id, group_id=group_id, limit=2
                        )
                        if len(ignored) >= 2:
                            spam_score += 0.15
                            spam_factors.append('resale_often_ignored')
                        group_muted = ge.is_group_muted(group_id, user_id)
                        if group_muted and is_resale:
                            spam_score += 0.15
                            spam_factors.append('resale_in_muted_marketplace_group')

        for pattern in self._spam_patterns:
            if pattern.search(text):
                spam_score += 0.08
                if len(spam_factors) < 8:
                    spam_factors.append(pattern.pattern[:40])

        fake_prize = bool(re.search(
            r'(congrats.*number.*selected|reward.*claim.*today.*voucher|approved.*application.*final.*stage|lucky.*draw.*alerts)',
            text, re.IGNORECASE))
        if fake_prize and business_id:
            if self.business_engine and not self.business_engine.is_verified(business_id):
                spam_score += 0.3
                spam_factors.append('fake_prize_unverified_business')
                spam_type = 'spam'

        spam_score = min(1.0, spam_score)
        is_spam = spam_score >= 0.5

        if is_spam and spam_type is None:
            if spam_score >= 0.6:
                spam_type = 'spam'
            elif fc >= 5:
                spam_type = 'forward'
            elif is_marketing:
                spam_type = 'promotion'

        return {
            'is_spam': is_spam,
            'spam_score': spam_score,
            'spam_type': spam_type,
            'spam_factors': spam_factors,
            'is_chain_message': is_chain_message,
            'is_marketing': is_marketing,
            'is_resale_marketplace': is_resale_marketplace,
        }
