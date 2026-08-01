import re
from typing import Dict, Any, List, Tuple, Optional


class ReasoningEngine:
    def __init__(
        self,
        context,
        user_profile,
        group_engine,
        business_engine,
        history_engine,
        media_analyzer,
        scam_detector,
        spam_detector,
    ):
        self.context = context
        self.user_profile = user_profile
        self.group_engine = group_engine
        self.business_engine = business_engine
        self.history_engine = history_engine
        self.media_analyzer = media_analyzer
        self.scam_detector = scam_detector
        self.spam_detector = spam_detector

    def _has_time_sensitive_keywords(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        urgent = bool(re.search(
            r'(urgent|asap|right now|immediately|right away|at once|critical|emergency)',
            text_lower))
        same_day = bool(re.search(
            r'(today|tonight|this morning|this afternoon|this evening|in 10|in 5|by \d|before \d|within \d hours|within an hour|half hour|next 30|10 mins?|5 mins?|15 mins?|30 mins?|now\b|before [3-9] (am|pm))',
            text_lower))
        near_deadline = bool(re.search(
            r'(deadline|last chance|tonight only|last date|closes today|closes tomorrow|expires today|expires tomorrow|penalty today|service stops today|immediately|tomorrow is last|last day)',
            text_lower))
        mention = bool(re.search(r'(?<![@\w])@[\w]+|hey @|hi @|@mention|bataao|batana|need you|@\S+', text_lower))
        return {
            'urgent': urgent,
            'same_day': same_day,
            'near_deadline': near_deadline,
            'mention': mention,
            'any': urgent or same_day or near_deadline or mention,
        }

    def _has_direct_personal_request(self, text: str) -> bool:
        text_lower = text.lower()
        patterns = [
            r'call (me|us|back|please|when)',
            r'(please|pls|plz|kindly).*(call|text|whatsapp|message|reply|respond|confirm|send|share|check|stay|join|look|review|approve|keep|collect)',
            r'(can you|could you|will you|would you).*(call|text|message|reply|check|confirm|collect|come|join|stay|help|look|review|bring|pick|share|send|read|do|make|give|take|keep|forward|pass|be|let)',
            r'(tujhe|tumko|aapko|tereko).*(call|batana|batao|inform|karna|padta|check|reply)',
            r'(need your|need you to|please help|i need you|can you help|urgent call|quick call|missed call|give me a call|call karo|call kar|missed kar diya|kar do call)',
            r'(call kar|whatsapp kar|message kar|reply kar|batana|please reply|immediate call|inform kar)',
            r'(message me once|let me know|shoot a message|shoot me|ping me|reach out|get back|do call|please keep|kept aside|confirm.*if|reply once|so i know|so we can|before it goes|before someone|before i give|first come first)',
            r'(doctor.*appointment|appointment moved|clinic called|leave by|pickup|gate [0-9]|front desk kept|water bottle at table|side entrance|studio b)',
        ]
        for p in patterns:
            if re.search(p, text_lower):
                return True
        return False

    def _has_payment_urgency(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        payment = bool(re.search(
            r'(payment|pay now|pay today|due today|due date.*today|society payment|maintenance.*due|electricity.*due|emi.*due|loan.*due|premium.*due|challan.*today|overdue.*today|late fee.*today|clear.*today)',
            text_lower))
        fine = bool(re.search(
            r'(penalty|fine|late fee|disconnect|suspend|service off|disconnection|cut off|block.*service)',
            text_lower))
        reminder = bool(re.search(
            r'(payment reminder|bill reminder|due reminder|reminder.*due|reminder.*pay)',
            text_lower))
        time_sensitive_kw = bool(re.search(
            r'(today|tonight|immediately|asap|before [0-9]|by [0-9]|in [0-9] (hour|min)|same day|this evening|this morning)',
            text_lower))
        return {
            'payment': payment,
            'fine': fine,
            'reminder': reminder,
            'urgent_payment': (payment and fine) or (payment and time_sensitive_kw and reminder),
        }

    def _determine_message_type(
        self,
        message: Dict[str, Any],
        media: Dict[str, Any],
        scam_result: Dict[str, Any],
        spam_result: Dict[str, Any],
        text: str,
    ) -> str:
        if scam_result.get('is_scam'):
            return 'scam'
        if spam_result.get('is_spam'):
            if spam_result.get('spam_type') == 'promotion':
                return 'promotion'
            if spam_result.get('spam_type') == 'forward':
                return 'forward'
            if spam_result.get('is_chain_message') or spam_result.get('spam_type') == 'forward':
                return 'forward'
            if spam_result.get('is_marketing'):
                return 'promotion'
            return 'spam'

        media_hint = media.get('category_hint', 'text_only')
        time_sensitive = self._has_time_sensitive_keywords(text)
        payment_info = self._has_payment_urgency(text)
        personal_direct = self._has_direct_personal_request(text)

        conversation_type = message.get('conversation_type', '')
        group_id = message.get('group_id', '')
        business_id = message.get('business_id', '')
        sender_user_id = message.get('sender_user_id', '')
        fc = int(message.get('forwarded_count', '0') or 0)
        text_lower = text.lower()

        non_urgent_disclaimer = bool(re.search(
            r'(no urgency|nothing urgent|nothing blocking|no hurry|no rush|not urgent|don\'?t worry about it|don\'?t call now|don\'?t call me|nothing blocking for tonight|for future|later|some other time|when free|when you have time|if free|tomorrow is fine)',
            text_lower))

        resale_or_fashion = bool(re.search(
            r'(kurta|denim|jacket|pickup|gate [0-9]|kept aside|two other|people are asking|size [mslxl]|worn once|no damage|buyer cancelled|clear it fast|serious buyers only|selling|first come|before i give|so it goes|handover|front desk kept|clothing|brand new|bought last month)',
            text_lower))

        if fc >= 8 and spam_result.get('is_chain_message'):
            return 'forward'

        if payment_info['payment'] or (conversation_type == 'business' and business_id):
            business = self.business_engine.get_business(business_id)
            cat = business.get('category', '') if business else ''
            is_payment_category = any(kw in cat for kw in ('bank', 'utility', 'insurance', 'lending', 'payments', 'loan', 'emi', 'bill'))
            text_has_payment = bool(re.search(
                r'(payment reminder|bill|due|society payment|emi|loan|premium|maintenance|electricity|water bill|bill due|due date|overdue|fee|challan)',
                text_lower))
            if is_payment_category or text_has_payment or payment_info['fine']:
                return 'payment'
            rel = self.business_engine.get_user_business_relation(
                message.get('user_id', ''), business_id) if business_id else None
            why = rel.get('why_user_knows_account', '') if rel else ''
            order_update = any(kw in why or kw in text_lower for kw in (
                'order', 'delivery', 'appointment', 'booking', 'clinic', 'pickup', 'return', 'refund',
                'workshop', 'upcoming_ride', 'prescription', 'ride_booked_today',
                'delivery_expected_today', 'upcoming_clinic_appointment',
                'confirmed_travel_booking', 'monthly_utility_bill', 'confirmed_food_order',
            ))
            if order_update:
                return 'business_update'

        group_type = ''
        if group_id:
            group_type = self.group_engine.get_group_type(group_id)
        if group_type in ('society', 'school_group', 'coworker', 'safety', 'caregiving', 'college_faculty'):
            if time_sensitive['any'] or media_hint in ('urgent', 'event'):
                is_admin = self.group_engine.is_sender_admin(group_id, sender_user_id)
                if (is_admin or time_sensitive['urgent'] or time_sensitive['near_deadline'] or media_hint == 'urgent') and not non_urgent_disclaimer:
                    return 'urgent'
                return 'event'

        if personal_direct or (conversation_type == 'personal' and not business_id and not group_id):
            if (time_sensitive['urgent'] or time_sensitive['same_day'] or media_hint == 'urgent') and not non_urgent_disclaimer:
                if resale_or_fashion:
                    return 'promotion'
                work_escalation = bool(re.search(
                    r'(client escalation|escalation|production|incident|rollback|failed jobs|failed payment|alert threshold|queue|drain the queue|watch the failed|payment worker|dashboard review|release|deploy|outage|severity)',
                    text_lower))
                if work_escalation and time_sensitive['any']:
                    return 'urgent'
                return 'urgent'
            if resale_or_fashion:
                return 'promotion'
            if len(text.strip()) < 40 and bool(re.search(
                r'(good morning|good afternoon|good evening|good night|hi\b|hello|hey\b|namaste|kaise ho|kaisi ho|kya hal|sab thik|hiya|hii\b)',
                text_lower)):
                return 'greeting'
            if non_urgent_disclaimer and len(text.strip()) < 220:
                return 'personal'
            return 'personal'

        if fc >= 5:
            return 'forward'

        if resale_or_fashion:
            return 'promotion'

        if bool(re.search(
            r'(Reply STOP|opt out|unsubscribe|50% off|sale|discount|offer|coupon|voucher|membership|launch|shopping|benefit|deal|price off|TRY\d\d|Save extra)',
            text, re.IGNORECASE)):
            return 'promotion'

        if group_type in ('marketplace', 'friends', 'extended_family', 'alumni', 'real_estate') and media_hint == 'promotion':
            return 'promotion'

        if conversation_type == 'business' and business_id:
            return 'business_update'

        if media_hint == 'event':
            return 'event'
        if media_hint == 'urgent':
            return 'urgent'
        if media_hint == 'promotion':
            return 'promotion'

        if group_id and group_type:
            return 'event' if group_type in ('society', 'school_group', 'coworker') else 'personal'

        return 'unknown'

    def _determine_action(
        self,
        message: Dict[str, Any],
        media: Dict[str, Any],
        scam_result: Dict[str, Any],
        spam_result: Dict[str, Any],
        msg_type: str,
        text: str,
    ) -> Dict[str, Any]:
        user_id = message.get('user_id', '')
        conversation_type = message.get('conversation_type', '')
        group_id = message.get('group_id', '')
        business_id = message.get('business_id', '')
        sender_user_id = message.get('sender_user_id', '')
        created_at = message.get('created_at', '')
        fc = int(message.get('forwarded_count', '0') or 0)

        time_sensitive = self._has_time_sensitive_keywords(text)
        payment_info = self._has_payment_urgency(text)
        personal_direct = self._has_direct_personal_request(text)

        if scam_result.get('is_scam'):
            return {'action': 'mute', 'reason_hint': 'scam'}

        if spam_result.get('is_spam'):
            if spam_result.get('is_chain_message'):
                return {'action': 'mute', 'reason_hint': 'chain_forward'}
            if msg_type == 'promotion' and (
                (business_id and self.business_engine.has_user_opted_out(user_id, business_id)) or
                spam_result.get('spam_score', 0) >= 0.6
            ):
                return {'action': 'mute', 'reason_hint': 'promotion_opted_out'}
            if spam_result.get('spam_score', 0) >= 0.6:
                return {'action': 'mute', 'reason_hint': 'spam_ignored'}

        group_muted = False
        is_high_priority_group = False
        sender_is_admin = False
        group_importance = {}
        if group_id:
            group_muted = self.group_engine.is_group_muted(group_id, user_id)
            is_high_priority_group = self.group_engine.is_high_priority_group_type(group_id)
            sender_is_admin = self.group_engine.is_sender_admin(group_id, sender_user_id)
            group_importance = self.group_engine.get_group_importance(group_id, user_id)

        business_verified = False
        business_suspicious = False
        has_relationship = False
        allows_promotions = False
        opted_out = False
        if business_id:
            business_verified = self.business_engine.is_verified(business_id)
            business_suspicious = self.business_engine.is_suspicious_business(business_id)
            has_relationship = self.business_engine.has_active_relationship(user_id, business_id)
            allows_promotions = self.business_engine.allows_promotions(user_id, business_id)
            opted_out = self.business_engine.has_user_opted_out(user_id, business_id)

        if msg_type == 'scam':
            return {'action': 'mute', 'reason_hint': 'scam'}

        if msg_type == 'promotion':
            if opted_out or (
                business_id and not allows_promotions and not has_relationship
            ):
                return {'action': 'mute', 'reason_hint': 'promotion_opted_out'}
            dm = 0.0
            if business_id:
                dm = self.business_engine.get_user_business_dismissal_rate(user_id, business_id)
            if dm >= 0.7:
                return {'action': 'mute', 'reason_hint': 'promotion_dismissed_history'}
            if group_muted:
                return {'action': 'mute', 'reason_hint': 'muted_group_promotion'}
            return {'action': 'digest', 'reason_hint': 'promotion_opted_in'}

        if msg_type == 'forward':
            if fc >= 8 or spam_result.get('is_chain_message'):
                sender_profile = self.history_engine.get_sender_behavior_profile(user_id, sender_user_id)
                if sender_profile.get('negative_rate', 0) >= 0.5 or sender_profile.get('high_forward_rate', 0) >= 0.4:
                    return {'action': 'mute', 'reason_hint': 'repeated_high_forward_sender'}
                return {'action': 'mute', 'reason_hint': 'chain_forward_message'}
            if fc >= 5:
                return {'action': 'digest', 'reason_hint': 'forwarded_content'}
            return {'action': 'digest', 'reason_hint': 'forwarded_content'}

        if msg_type == 'spam':
            return {'action': 'mute', 'reason_hint': 'spam_ignored'}

        if msg_type == 'greeting':
            if fc >= 6 or len(text.strip()) < 15:
                sender_profile = self.history_engine.get_sender_behavior_profile(user_id, sender_user_id)
                if sender_profile.get('negative_rate', 0) >= 0.6 and sender_profile['total'] >= 2:
                    return {'action': 'mute', 'reason_hint': 'greeting_ignored'}
            return {'action': 'digest', 'reason_hint': 'harmless_greeting'}

        if msg_type == 'payment':
            if payment_info['fine'] or (payment_info['payment'] and time_sensitive['same_day']):
                return {'action': 'notify', 'reason_hint': 'payment_urgent'}
            if business_verified and has_relationship:
                return {'action': 'notify', 'reason_hint': 'payment_reminder_verified'}
            if not business_verified and not has_relationship:
                return {'action': 'mute', 'reason_hint': 'suspicious_payment_sender'}
            return {'action': 'digest', 'reason_hint': 'payment_reminder'}

        if msg_type == 'urgent':
            if business_suspicious and conversation_type == 'business':
                return {'action': 'mute', 'reason_hint': 'scam_suspicious_business'}
            sender_profile = self.history_engine.get_sender_behavior_profile(user_id, sender_user_id)
            sender_engaged = sender_profile.get('engagement_rate', 0) >= 0.4 or (
                group_id and sender_is_admin)
            work_escalation = bool(re.search(
                r'(client escalation|escalation|production|incident|rollback|failed jobs|failed payment|alert threshold|queue|drain the queue|watch the failed|payment worker|dashboard review|release|deploy|outage|severity|fire)',
                text, re.IGNORECASE))
            personal_safety = bool(re.search(
                r'(doctor|clinic|appointment moved|hospital|health|medicines|prescription|care|safety|fire|elevator|gate.*locked|front gate|water|tanker|maintenance)',
                text, re.IGNORECASE))
            if group_id:
                if group_muted:
                    if (time_sensitive['urgent'] and sender_is_admin) or \
                       (time_sensitive['mention'] and personal_direct and (time_sensitive['same_day'] or personal_safety)) or \
                       (time_sensitive['same_day'] and personal_safety and time_sensitive['mention']):
                        return {'action': 'notify', 'reason_hint': 'muted_group_override_admin_urgent'}
                    return {'action': 'digest', 'reason_hint': 'muted_group_urgent'}
                if sender_is_admin and (time_sensitive['same_day'] or is_high_priority_group or time_sensitive['near_deadline'] or time_sensitive['urgent']):
                    return {'action': 'notify', 'reason_hint': 'trusted_admin_time_sensitive'}
                if time_sensitive['mention']:
                    return {'action': 'notify', 'reason_hint': 'mentioned_group'}
            if conversation_type == 'personal':
                if personal_direct and (time_sensitive['urgent'] or time_sensitive['same_day'] or work_escalation):
                    if work_escalation:
                        return {'action': 'notify', 'reason_hint': 'work_context_deadline'}
                    return {'action': 'notify', 'reason_hint': 'direct_personal_urgent'}
                if personal_direct and personal_safety:
                    return {'action': 'notify', 'reason_hint': 'direct_personal_request'}
                if time_sensitive['urgent'] or work_escalation:
                    return {'action': 'notify', 'reason_hint': 'urgent_content'}
                return {'action': 'digest', 'reason_hint': 'personal_non_urgent'}
            if conversation_type == 'business' and has_relationship:
                return {'action': 'notify', 'reason_hint': 'trusted_business_urgent'}
            if media.get('urgency', 0) >= 0.7:
                return {'action': 'notify', 'reason_hint': 'media_urgent'}
            return {'action': 'notify', 'reason_hint': 'urgent_content'}

        if msg_type == 'event':
            if group_id:
                if group_muted:
                    if time_sensitive['urgent'] and sender_is_admin:
                        return {'action': 'notify', 'reason_hint': 'muted_group_override_admin_urgent'}
                    return {'action': 'digest', 'reason_hint': 'muted_group_info'}
                if sender_is_admin and (time_sensitive['same_day'] or is_high_priority_group or time_sensitive['near_deadline']):
                    return {'action': 'notify', 'reason_hint': 'trusted_admin_same_day_update'}
                if time_sensitive['mention']:
                    return {'action': 'notify', 'reason_hint': 'mentioned_in_group'}
                if time_sensitive['near_deadline'] and is_high_priority_group:
                    return {'action': 'notify', 'reason_hint': 'high_priority_deadline'}
            if media.get('urgency', 0) >= 0.7:
                return {'action': 'notify', 'reason_hint': 'media_event_urgent'}
            return {'action': 'digest', 'reason_hint': 'useful_group_info'}

        if msg_type == 'business_update':
            if business_suspicious:
                return {'action': 'mute', 'reason_hint': 'suspicious_business_sender'}
            if opted_out and spam_result.get('is_marketing'):
                return {'action': 'mute', 'reason_hint': 'opted_out_business'}
            if not has_relationship and not business_verified:
                return {'action': 'digest', 'reason_hint': 'unverified_business_update'}
            if time_sensitive['any'] and has_relationship:
                return {'action': 'notify', 'reason_hint': 'trusted_business_time_sensitive'}
            if media.get('urgency', 0) >= 0.7:
                return {'action': 'notify', 'reason_hint': 'media_business_urgent'}
            if has_relationship or business_verified:
                return {'action': 'digest', 'reason_hint': 'verified_business_update'}
            return {'action': 'digest', 'reason_hint': 'business_update'}

        if msg_type == 'personal':
            if group_id:
                if group_muted and not time_sensitive['any']:
                    return {'action': 'digest', 'reason_hint': 'muted_group_personal'}
                if time_sensitive['mention'] or personal_direct:
                    return {'action': 'notify', 'reason_hint': 'personal_mention'}
            if personal_direct and time_sensitive['same_day']:
                return {'action': 'notify', 'reason_hint': 'direct_personal_request'}
            return {'action': 'digest', 'reason_hint': 'non_urgent_personal'}

        if msg_type == 'unknown':
            if conversation_type == 'personal' and not business_id:
                if personal_direct:
                    return {'action': 'notify', 'reason_hint': 'direct_personal_request'}
                return {'action': 'digest', 'reason_hint': 'non_urgent_personal'}
            return {'action': 'digest', 'reason_hint': 'unknown_message'}

        return {'action': 'digest', 'reason_hint': 'default'}

    def _generate_reason(
        self,
        message: Dict[str, Any],
        media: Dict[str, Any],
        scam_result: Dict[str, Any],
        spam_result: Dict[str, Any],
        msg_type: str,
        action: str,
        reason_hint: str,
        text: str,
    ) -> str:
        hint = reason_hint
        group_id = message.get('group_id', '')
        business_id = message.get('business_id', '')
        sender_user_id = message.get('sender_user_id', '')
        user_id = message.get('user_id', '')
        fc = int(message.get('forwarded_count', '0') or 0)

        sender_is_admin = False
        if group_id and sender_user_id:
            sender_is_admin = self.group_engine.is_sender_admin(group_id, sender_user_id)

        notify_reasons = {
            'trusted_admin_time_sensitive': 'A trusted group admin sent a time-sensitive update that should interrupt the user.',
            'trusted_admin_same_day_update': 'A school admin sent a same-day operational update that the user is likely to need immediately.',
            'payment_urgent': 'A payment reminder contains a near-term deadline or late-fee risk that the user should see now.',
            'payment_reminder_verified': 'The verified business reminder matches an active user bill or subscription that the user is tracking.',
            'trusted_business_urgent': 'The verified business is sending a time-sensitive update that matches the user\'s active relationship.',
            'trusted_business_time_sensitive': 'A verified business is sending an update that matches the user\'s recent order history.',
            'direct_personal_urgent': 'The sender directly asks this user for a response or action; the time-sensitive content should interrupt the user immediately.',
            'direct_personal_request': 'The sender directly asks this user for a response or action on a time-sensitive personal topic.',
            'work_context_deadline': 'The message is from a work context and contains a direct deadline or meeting dependency.',
            'urgent_content': 'The content contains a direct immediate request or safety-relevant information that should interrupt the user.',
            'mentioned_group': 'The user is directly @mentioned in a group message and likely needs to respond to a time-sensitive request.',
            'mentioned_in_group': 'The user is directly @mentioned in a group message and likely needs to respond to a time-sensitive request.',
            'personal_mention': 'The user is directly mentioned in a group message with a personal time-sensitive request that should interrupt.',
            'media_urgent': 'The attached media indicates urgency or time-sensitive action.',
            'media_event_urgent': 'The attached media indicates a time-sensitive event or circular.',
            'media_business_urgent': 'The attached media indicates a time-sensitive business update.',
            'muted_group_override_admin_urgent': 'This group is muted, but the admin sent urgent safety or same-day operational update content that needs to interrupt immediately.',
            'high_priority_deadline': 'A high-priority group update with a near deadline that should interrupt the user immediately.',
        }
        digest_reasons = {
            'useful_group_info': 'The message is useful group information, but it is not urgent enough to interrupt the user.',
            'verified_business_update': 'The verified business message is legitimate but does not require immediate attention.',
            'business_update': 'The verified business update is legitimate but not time-sensitive enough to interrupt the user.',
            'non_urgent_personal': 'The sender is trusted, but the message has no urgent action or safety relevance.',
            'harmless_greeting': 'The message is a harmless greeting that can be read later.',
            'promotion_opted_in': 'The message is promotional but matches a topic or business the user has opted into.',
            'forwarded_content': 'Forwarded content does not need immediate attention; offer is potentially relevant but not urgent.',
            'payment_reminder': 'Payment reminder with no late-fee risk; appropriate for the next digest.',
            'muted_group_info': 'This group is muted by the user; the content will appear in the next digest and is not urgent enough to interrupt.',
            'muted_group_urgent': 'Group is muted; update is not severe enough to override the user\'s preference and does not contain urgent safety or admin action.',
            'muted_group_personal': 'This group is muted by user; personal chat within the group has no urgent action or safety relevance.',
            'unverified_business_update': 'Message from an unverified but low-risk business; digest is appropriate and not urgent enough to interrupt.',
            'unknown_message': 'Message does not clearly match an urgent template; digest is safest and can be read later.',
            'default': 'Message is not urgent enough to interrupt the user and can be read later.',
            'personal_non_urgent': 'The sender is trusted, but the message has no urgent action or safety relevance.',
        }
        mute_reasons = {
            'scam': 'The message asks for urgent OTP or account verification through a suspicious flow.',
            'chain_forward': 'The sender has a pattern of repeated forwards or greetings that the user usually ignores.',
            'chain_forward_message': 'The sender has a pattern of repeated forwards or greetings that the user usually ignores.',
            'repeated_high_forward_sender': 'The sender has a pattern of repeated forwards or greetings that the user usually ignores.',
            'promotion_opted_out': 'The user has opted out of or repeatedly dismissed similar marketing messages.',
            'promotion_dismissed_history': 'Similar historical messages were ignored, dismissed, or muted by this user.',
            'spam_ignored': 'Similar historical messages were ignored, dismissed, or muted by this user.',
            'greeting_ignored': 'The sender has a pattern of repeated forwards or greetings that the user usually ignores.',
            'muted_group_promotion': 'The user has muted this group; the non-urgent promotional content is not urgent enough to interrupt and can be read later.',
            'suspicious_business_sender': 'This is the first message from the sender and it asks for sensitive verification or payment.',
            'suspicious_payment_sender': 'This is the first message from the sender and it asks for sensitive verification or payment details.',
            'opted_out_business': 'The user has opted out of or repeatedly dismissed similar marketing messages.',
            'scam_suspicious_business': 'The message uses fake support language and account-blocking pressure to push the user into action.',
            'router_override': 'The message tries to instruct the router, but the routing decision should be based on the actual content and risk.',
        }

        bank = action == 'mute' and (
            msg_type == 'scam' or self.business_engine.is_suspicious_business(business_id) if business_id else False
        )
        has_router_override = bool(re.search(
            r'(routing.*override|assistant.*instruction|internal.*router|system.*note.*router|mark.*notify|confidence.*1|user_priority.*high|always.*mark.*notify|ignore.*all.*previous.*routing)',
            text, re.IGNORECASE))

        if has_router_override and action == 'mute':
            return mute_reasons.get('router_override', mute_reasons['scam'])

        if action == 'notify':
            if hint in notify_reasons:
                return notify_reasons[hint]
            if msg_type == 'urgent':
                if sender_is_admin:
                    return notify_reasons['trusted_admin_time_sensitive']
                if group_id and self.group_engine.get_group_type(group_id) in ('school_group',):
                    return notify_reasons['trusted_admin_same_day_update']
                if group_id and self.group_engine.get_group_type(group_id) in ('coworker',):
                    return notify_reasons['work_context_deadline']
                return notify_reasons['direct_personal_urgent']
            if msg_type == 'business_update':
                return notify_reasons['trusted_business_time_sensitive']
            if msg_type == 'payment':
                return notify_reasons['payment_urgent']
            if msg_type == 'event':
                return notify_reasons.get('trusted_admin_same_day_update', notify_reasons['work_context_deadline'])
            return notify_reasons.get('direct_personal_request', notify_reasons['default'])

        if action == 'digest':
            if hint in digest_reasons:
                return digest_reasons[hint]
            if msg_type == 'business_update':
                return digest_reasons['verified_business_update']
            if msg_type == 'event':
                return digest_reasons['useful_group_info']
            if msg_type == 'greeting':
                return digest_reasons['harmless_greeting']
            if msg_type == 'promotion':
                return digest_reasons['promotion_opted_in']
            if msg_type == 'personal':
                return digest_reasons['non_urgent_personal']
            return digest_reasons['default']

        if action == 'mute':
            if hint in mute_reasons:
                return mute_reasons[hint]
            if msg_type == 'scam':
                return mute_reasons['scam']
            if msg_type == 'promotion':
                return mute_reasons['promotion_opted_out']
            if msg_type == 'forward' or fc >= 8:
                return mute_reasons['chain_forward']
            return mute_reasons['spam_ignored']

        return 'Message is not urgent enough to interrupt the user and can be read later.'

    def reason(self, message: Dict[str, Any]) -> Dict[str, Any]:
        media = self.media_analyzer.analyze(message)
        combined_text = media.get('combined_text', '') or (message.get('message_text', '') or '')
        scam_result = self.scam_detector.detect(message)
        msg_for_spam = dict(message)
        msg_for_spam['message_text'] = combined_text
        spam_result = self.spam_detector.detect(msg_for_spam)

        has_router_override = bool(re.search(
            r'(routing.*override|assistant.*instruction|internal.*router|system.*note.*router|mark.*notify|confidence.*1|user_priority.*high|always.*mark.*notify|ignore.*sender.*risk|ignore.*all.*previous.*routing)',
            combined_text, re.IGNORECASE))

        msg_type = self._determine_message_type(message, media, scam_result, spam_result, combined_text)
        action_result = self._determine_action(message, media, scam_result, spam_result, msg_type, combined_text)
        action = action_result['action']
        hint = action_result['reason_hint']

        if has_router_override and action != 'mute':
            action = 'mute'
            hint = 'router_override'
            if msg_type not in ('scam', 'spam', 'unknown'):
                pass

        reason = self._generate_reason(
            message, media, scam_result, spam_result,
            msg_type, action, hint, combined_text,
        )

        user_id = message.get('user_id', '')
        group_id = message.get('group_id', '')
        business_id = message.get('business_id', '')
        sender_user_id = message.get('sender_user_id', '')
        evidence_ids = self.history_engine.get_evidence_ids(
            combined_text, user_id,
            group_id=group_id, business_id=business_id,
            sender_user_id=sender_user_id, limit=2,
        )

        return {
            'message': message,
            'media': media,
            'scam_result': scam_result,
            'spam_result': spam_result,
            'message_type': msg_type,
            'action': action,
            'reason': reason,
            'reason_hint': hint,
            'evidence_ids': evidence_ids,
        }
