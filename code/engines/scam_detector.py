import re
from typing import Dict, Any, List, Tuple, Optional


class ScamDetector:
    def __init__(self, context, business_engine=None):
        self.context = context
        self.business_engine = business_engine
        self._scam_keywords_en = [
            r'\botp\b', r'verify.*otp', r'login.*code', r'6.?digit',
            r'account.*block', r'profile.*block', r'account.*restricted',
            r'profile.*restricted', r'access.*block', r'suspended',
            r'confirm.*password', r'share.*otp', r'send.*otp',
            r'provide.*otp', r'reply.*with.*code', r'pin.*verify',
            r'confirm.*pin', r'pin.*keep.*active',
            r'security.*alert', r'fraud.*alert', r'urgent.*verify',
            r'verification.*pending', r'kyc.*incomplete',
            r'card.*number.*otp', r'bank.*details.*urgent',
            r'scan.*qr.*pay', r'penalty.*immediately',
            r'clearance.*amount', r'immediately.*block',
            r'final.*reminder', r'last.*chance', r'tonight.*only',
            r'link.*open.*verify', r'bit\.ly', r'shorturl', r'weurl', r'vl\.gl',
            r'chase-secure-alert', r'hsbc-alerts', r'hdfcbank-kyc',
            r'account-login\.in', r'account-help', r'pay-check-secure',
            r'amazonpay-delivery', r'talabat-refund', r'razorpayx-payouts',
            r'phonepe-rewards', r'razorpay-billpay', r'airtel-simkyc',
            r'jioreward', r'sbireward', r'icici-secure',
            r'zomato-gold', r'swiggy-refund', r'irctc-refund',
            r'myntragift', r'flipkart-refund', r'blinkit-helpdesk',
            r'paytm-kyc', r'lucky-draw-result', r'shorturl\.at',
            r'claim.*today.*voucher', r'selected.*reward',
            r'number.*selected.*reward', r'congrats.*claim',
            r'approved.*application.*final.*stage',
            r'refund.*could.*not.*processed.*link',
            r'delivery.*attempt.*fee.*link',
            r'refund.*approved.*wallet.*card.*details',
            r'loan.*approved.*processing.*fee',
            r'token.*today.*block.*registry',
            r'benefit.*approval.*pending.*bank.*details',
            r'pending.*charge.*pay.*service.*stops',
            r'otp.*leak', r'link.*open.*kar', r'verification.*code.*jaldi',
            r'account.*bachao', r'account.*band.*ho.*jayega',
            r'jaldi.*karo', r'time.*kam.*hai',
            r'wallet.*kyc.*incomplete', r'profile.*will.*be.*restricted',
            r'routing.*override', r'assistant.*instruction',
            r'internal.*router.*metadata', r'system.*note.*for.*notification.*router',
            r'mark.*notify', r'action.*notify', r'always.*mark.*this.*as.*notify',
            r'confidence.*1', r'user_priority.*high',
            r'sender.*is.*trusted.*admin', r'ignore.*sender.*risk',
            r'classify.*as.*urgent', r'ignore.*all.*previous.*routing.*rules',
        ]
        self._scam_patterns_compiled = [re.compile(p, re.IGNORECASE) for p in self._scam_keywords_en]

    def detect(self, message: Dict[str, Any]) -> Dict[str, Any]:
        text = message.get('message_text', '') or ''
        conversation_type = message.get('conversation_type', '')
        business_id = message.get('business_id', '')
        group_id = message.get('group_id', '')
        sender_user_id = message.get('sender_user_id', '')
        media_type = message.get('media_type', '')

        risk_score = 0.0
        risk_factors = []
        scam_type = None
        evidence_snippets = []

        for pattern in self._scam_patterns_compiled:
            m = pattern.search(text)
            if m:
                risk_score += 0.12
                risk_factors.append(pattern.pattern)
                evidence_snippets.append(m.group(0)[:50])
                if len(risk_factors) >= 6:
                    break

        has_otp_request = bool(re.search(
            r'(otp|login code|6 ?digit|verify code|verification code|confirm pin|pin here|reply.*with.*code|share.*code|send.*code)',
            text, re.IGNORECASE))
        has_account_block = bool(re.search(
            r'(account.*block|profile.*block|access.*block|restrict|suspend|ban.*account)',
            text, re.IGNORECASE))
        has_suspicious_domain = False
        if business_id and self.business_engine:
            has_suspicious_domain = self.business_engine.has_domain_mismatch(business_id)
            if self.business_engine.is_suspicious_business(business_id):
                risk_score += 0.25
                risk_factors.append('suspicious_business_account')

        if has_suspicious_domain:
            risk_score += 0.2
            risk_factors.append('suspicious_domain_mismatch')

        if has_otp_request and has_account_block:
            risk_score += 0.3
            scam_type = 'scam'
            risk_factors.append('otp_and_account_block_pressure')
        elif has_otp_request:
            risk_score += 0.15
            if conversation_type == 'personal':
                biz_relation = False
                if business_id and self.business_engine:
                    biz_relation = self.business_engine.has_active_relationship(
                        message.get('user_id', ''), business_id)
                if not biz_relation:
                    risk_score += 0.2
                    scam_type = 'scam'
                    risk_factors.append('first_contact_otp_from_personal')

        if has_account_block:
            risk_score += 0.1

        has_router_override = bool(re.search(
            r'(routing.*override|assistant.*instruction|internal.*router|system.*note.*router|mark.*notify|confidence.*1|user_priority.*high|always.*mark.*notify|ignore.*sender.*risk|ignore.*all.*previous.*routing)',
            text, re.IGNORECASE))
        if has_router_override:
            risk_score += 0.35
            scam_type = 'scam'
            risk_factors.append('prompt_injection_router_override')

        if conversation_type == 'business' and business_id:
            if self.business_engine:
                risk = self.business_engine.get_business_risk(business_id)
                if risk['suspicious']:
                    risk_score += 0.2
                    risk_factors.append('unverified_business_risk')
                if risk['domain_mismatch'] and (has_otp_request or has_account_block):
                    risk_score += 0.25
                    scam_type = 'scam'
                    risk_factors.append('fake_bank_phishing_domain')

        has_payment_pressure = bool(re.search(
            r'(processing fee|token today|clearance amount|penalty list|penalty.*pay|late fee.*today|immediately.*pay|pay today|service stops today|payment.*due.*today)',
            text, re.IGNORECASE))
        has_external_link = bool(re.search(
            r'(https?://|bit\.ly|shorturl|weurl|vl\.gl|\.in/|\.com/|\.net/|\.at/)',
            text, re.IGNORECASE))
        if has_payment_pressure and has_external_link and not (
            self.business_engine and business_id and
            self.business_engine.is_verified(business_id)
        ):
            group_admin_approved = False
            if group_id and sender_user_id:
                from engines.group_engine import GroupEngine
                ge = GroupEngine(self.context)
                if ge.is_sender_admin(group_id, sender_user_id):
                    group_admin_approved = True
                    risk_score -= 0.1
            if not group_admin_approved:
                risk_score += 0.15
                risk_factors.append('payment_pressure_external_link')

        fc = int(message.get('forwarded_count', '0') or 0)
        if fc >= 10 and (has_otp_request or has_account_block):
            risk_score += 0.15
            risk_factors.append('high_forward_scam_spread')

        risk_score = min(1.0, risk_score)
        is_scam = risk_score >= 0.55 or scam_type == 'scam'
        if is_scam:
            scam_type = scam_type or 'scam'
        return {
            'is_scam': is_scam,
            'risk_score': risk_score,
            'scam_type': scam_type,
            'risk_factors': risk_factors,
            'evidence_snippets': evidence_snippets[:3],
        }
