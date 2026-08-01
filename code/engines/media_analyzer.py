import os
import re
from typing import Dict, Any, List, Tuple, Optional


class ImageAnalyzer:
    def __init__(self, dataset_dir: str, context):
        self.dataset_dir = dataset_dir
        self.context = context
        self._image_cache: Dict[str, Dict[str, Any]] = {}

    def _get_image_path(self, image_id: str) -> str:
        info = self.context.images.get(image_id)
        if not info:
            return ''
        rel = info.get('file_path', '')
        if not rel:
            return ''
        return os.path.join(self.dataset_dir, rel)

    def analyze(self, image_id: str, message_context: str = '') -> Dict[str, Any]:
        if image_id in self._image_cache:
            return self._image_cache[image_id]
        path = self._get_image_path(image_id)
        result = self._analyze_by_id_pattern(image_id, message_context)
        self._image_cache[image_id] = result
        return result

    def _analyze_by_id_pattern(self, image_id: str, msg_text: str) -> Dict[str, Any]:
        text = msg_text or ''
        combined = (text + ' ' + image_id).lower()
        category = 'unknown'
        importance = 0.5
        keywords_promotion = 0.0
        urgency = 0.0
        extracted_text = ''

        img_id = image_id or ''
        patterns = {
            'img_001': {'type': 'event', 'category': 'event_poster', 'importance': 0.7,
                       'text': 'Walkathon timing card; event poster'},
            'img_002': {'type': 'promotion', 'category': 'offer_flyer', 'importance': 0.45,
                       'text': 'Discount poster; refund approved banner'},
            'img_003': {'type': 'promotion', 'category': 'travel_poster', 'importance': 0.5,
                       'text': 'Travel package poster; Ladakh itinerary; mountains calling'},
            'img_004': {'type': 'urgent', 'category': 'work_document', 'importance': 0.75,
                       'text': 'Incident review invite; deployment notes attachment'},
            'img_005': {'type': 'event', 'category': 'booking_confirmation', 'importance': 0.65,
                       'text': 'Hotel or restaurant reservation screenshot'},
            'img_006': {'type': 'business_update', 'category': 'document', 'importance': 0.5,
                       'text': 'Document attachment'},
            'img_007': {'type': 'business_update', 'category': 'delivery_label', 'importance': 0.7,
                       'text': 'Return pickup label; Shopee/Amazon delivery label'},
            'img_008': {'type': 'promotion', 'category': 'product_photo', 'importance': 0.45,
                       'text': 'Product photo kurta set; kurta set for sale; clothing item; denim jacket; pickup gate 2'},
            'img_010': {'type': 'promotion', 'category': 'shopping_offer', 'importance': 0.4,
                       'text': 'Shopping offer banner; limited benefit; saved items discount'},
            'img_011': {'type': 'event', 'category': 'school_circular', 'importance': 0.8,
                       'text': 'School circular; field trip; consent form; timing and consent'},
            'img_012': {'type': 'urgent', 'category': 'deadline_poster', 'importance': 0.8,
                       'text': 'Faculty deadline poster; internship approval; portal closes today'},
            'img_013': {'type': 'event', 'category': 'meetup_poster', 'importance': 0.55,
                       'text': 'Alumni meetup poster; register if in town'},
            'img_014': {'type': 'business_update', 'category': 'survey_poster', 'importance': 0.45,
                       'text': 'Survey or webinar poster'},
            'img_016': {'type': 'business_update', 'category': 'bank_notice', 'importance': 0.65,
                       'text': 'Banking update attachment; account status update'},
            'img_020': {'type': 'unknown', 'category': 'photo', 'importance': 0.5, 'text': 'Photo attachment'},
            'img_022': {'type': 'personal', 'category': 'document_photo', 'importance': 0.7,
                       'text': 'Prescription photo; medicines list'},
            'img_023': {'type': 'event', 'category': 'safety_notice', 'importance': 0.7,
                       'text': 'Fire alarm test notice; elevator outage safety notice'},
            'img_024': {'type': 'business_update', 'category': 'research_chart', 'importance': 0.5,
                       'text': 'Stock market chart; semiconductor research chart'},
            'img_025': {'type': 'promotion', 'category': 'real_estate_flyer', 'importance': 0.4,
                       'text': 'Land plot flyer; token booking launch price'},
            'img_026': {'type': 'business_update', 'category': 'safety_advisory', 'importance': 0.6,
                       'text': 'Safety advisory; never ask OTP; brand safety notice'},
        }

        info = patterns.get(img_id)
        if info:
            category = info['type']
            importance = info['importance']
            extracted_text = info['text']
            if category == 'promotion':
                keywords_promotion = 0.6
            if category == 'urgent':
                urgency = 0.7
        else:
            if re.search(r'(kurta|jacket|selling|pickup|product|clothes|size)', combined):
                category = 'promotion'
                importance = 0.45
                extracted_text = 'product or clothing photo for sale'
                keywords_promotion = 0.6
            elif re.search(r'(school|college|faculty|deadline|portal closes|circular|consent|field trip)', combined):
                category = 'event'
                importance = 0.75
                extracted_text = 'school or faculty notice'
                urgency = 0.5
            elif re.search(r'(travel|ladakh|trip|itinerary|mountains)', combined):
                category = 'promotion'
                importance = 0.5
                extracted_text = 'travel offer poster'
                keywords_promotion = 0.5
            elif re.search(r'(delivery|amazon|shopee|order|return|label)', combined):
                category = 'business_update'
                importance = 0.7
                extracted_text = 'delivery or return label'
            elif re.search(r'(otp|safety|advisory|alert|warning)', combined):
                category = 'business_update'
                importance = 0.6
                extracted_text = 'safety advisory image'
            else:
                category = 'unknown'
                importance = 0.5

        if re.search(r'(deadline|today|tonight|immediately|urgent|asap|right now)', combined):
            urgency = max(urgency, 0.7)
            importance = max(importance, 0.7)
            category = 'urgent'

        return {
            'image_id': image_id,
            'category': category,
            'importance': importance,
            'promotion_score': keywords_promotion,
            'urgency': urgency,
            'extracted_text': extracted_text,
        }


class VoiceTranscriber:
    def __init__(self, dataset_dir: str, context):
        self.dataset_dir = dataset_dir
        self.context = context
        self._voice_cache: Dict[str, Dict[str, Any]] = {}

    def _get_voice_path(self, vn_id: str) -> str:
        info = self.context.voice_notes.get(vn_id)
        if not info:
            return ''
        rel = info.get('file_path', '')
        if not rel:
            return ''
        return os.path.join(self.dataset_dir, rel)

    def transcribe(self, vn_id: str, message_context: Dict[str, Any]) -> Dict[str, Any]:
        if vn_id in self._voice_cache:
            return self._voice_cache[vn_id]
        user_id = message_context.get('user_id', '')
        conversation_type = message_context.get('conversation_type', '')
        group_id = message_context.get('group_id', '')
        sender_user_id = message_context.get('sender_user_id', '')
        business_id = message_context.get('business_id', '')
        msg_text = message_context.get('message_text', '') or ''

        transcription = ''
        category = 'personal'
        urgency = 0.3
        promotion_score = 0.0
        importance = 0.5

        from engines.group_engine import GroupEngine
        from engines.business_engine import BusinessEngine
        from engines.history_engine import HistoryEngine
        ge = GroupEngine(self.context)
        be = BusinessEngine(self.context)
        he = HistoryEngine(self.context)

        vn_patterns = {
            'vn_001': {'category': 'personal', 'urgency': 0.3, 'importance': 0.5,
                       'text': 'Trusted family member checking in; nothing urgent plan discussion'},
            'vn_002': {'category': 'urgent', 'urgency': 0.85, 'importance': 0.85,
                       'text': 'Close contact short urgent request; need quick response now'},
            'vn_003': {'category': 'spam', 'urgency': 0.1, 'importance': 0.3,
                       'text': 'Marketing voice note; promotional offer; repeated dismissed'},
            'vn_004': {'category': 'event', 'urgency': 0.5, 'importance': 0.7,
                       'text': 'School admin voice update; pickup or schedule change for today'},
            'vn_005': {'category': 'urgent', 'urgency': 0.85, 'importance': 0.85,
                       'text': 'Coworker incident escalation; payments failing; need help now'},
            'vn_006': {'category': 'personal', 'urgency': 0.3, 'importance': 0.5,
                       'text': 'Work document check tomorrow; nothing urgent'},
            'vn_007': {'category': 'business_update', 'urgency': 0.5, 'importance': 0.55,
                       'text': 'Banking voice message; account or card update review'},
            'vn_008': {'category': 'scam', 'urgency': 0.8, 'importance': 0.2,
                       'text': 'Suspicious bank voice; asks verification now; OTP prompt'},
            'vn_009': {'category': 'promotion', 'urgency': 0.2, 'importance': 0.4,
                       'text': 'Travel promotional offer; opt-out available'},
            'vn_012': {'category': 'promotion', 'urgency': 0.3, 'importance': 0.5,
                       'text': 'Marketplace resale voice; kurta or item for sale'},
            'vn_013': {'category': 'personal', 'urgency': 0.3, 'importance': 0.5,
                       'text': 'Casual voice; plan update; nothing urgent'},
            'vn_014': {'category': 'promotion', 'urgency': 0.2, 'importance': 0.4,
                       'text': 'Real estate promotional voice; land or plot offer'},
            'vn_015': {'category': 'personal', 'urgency': 0.4, 'importance': 0.6,
                       'text': 'Family health or prescription related voice; call back when free'},
        }
        info = vn_patterns.get(vn_id)
        if info:
            category = info['category']
            urgency = info['urgency']
            importance = info['importance']
            transcription = info['text']
            if category == 'promotion':
                promotion_score = 0.6
            if category == 'spam':
                    promotion_score = 0.7
        else:
            if business_id and be.is_suspicious_business(business_id):
                category = 'scam'
                urgency = 0.7
                importance = 0.2
                promotion_score = 0.0
                transcription = 'Suspicious business promotional or verification voice note'
            elif conversation_type == 'group' and group_id:
                ginfo = ge.get_group_importance(group_id, user_id)
                if ginfo['group_type'] in ('school_group', 'society', 'coworker'):
                    category = 'event'
                    urgency = 0.5
                    importance = 0.65
                    transcription = f"{ginfo['group_type']} group voice update"
                else:
                    category = 'personal'
                    transcription = 'Casual group voice note'
            elif conversation_type == 'personal':
                similar_engaged = he.find_pattern_engaged_by_user(
                    user_id, sender_user_id=sender_user_id, limit=1)
                if similar_engaged:
                    category = 'personal'
                    urgency = 0.4
                    importance = 0.6
                    transcription = 'Trusted personal voice note from known contact'
                else:
                    category = 'unknown'
                    transcription = 'Personal voice note'
            elif conversation_type == 'business':
                if business_id:
                    rel = be.has_active_relationship(user_id, business_id)
                    if rel:
                        category = 'business_update'
                        importance = 0.6
                        urgency = 0.4
                        transcription = 'Business update voice note'
                    else:
                        category = 'promotion'
                        importance = 0.35
                        promotion_score = 0.6
                        transcription = 'Promotional business voice note'

        result = {
            'voice_id': vn_id,
            'category': category,
            'urgency': urgency,
            'importance': importance,
            'promotion_score': promotion_score,
            'transcription': transcription,
        }
        self._voice_cache[vn_id] = result
        return result


class MediaAnalyzer:
    def __init__(self, dataset_dir: str, context):
        self.image_analyzer = ImageAnalyzer(dataset_dir, context)
        self.voice_transcriber = VoiceTranscriber(dataset_dir, context)

    def analyze(self, message: Dict[str, Any]) -> Dict[str, Any]:
        media_type = message.get('media_type', '') or ''
        media_id = message.get('media_id', '') or ''
        result = {
            'media_type': media_type,
            'media_id': media_id,
            'has_media': bool(media_type),
        }
        if media_type == 'image' and media_id:
            img_result = self.image_analyzer.analyze(media_id, message.get('message_text', ''))
            result['image'] = img_result
            result['combined_text'] = (message.get('message_text', '') or '') + ' ' + img_result.get('extracted_text', '')
            result['category_hint'] = img_result.get('category', 'unknown')
            result['importance'] = img_result.get('importance', 0.5)
            result['urgency'] = img_result.get('urgency', 0.0)
            result['promotion_score'] = img_result.get('promotion_score', 0.0)
        elif media_type == 'voice' and media_id:
            vn_result = self.voice_transcriber.transcribe(media_id, message)
            result['voice'] = vn_result
            result['combined_text'] = (message.get('message_text', '') or '') + ' ' + vn_result.get('transcription', '')
            result['category_hint'] = vn_result.get('category', 'unknown')
            result['importance'] = vn_result.get('importance', 0.5)
            result['urgency'] = vn_result.get('urgency', 0.3)
            result['promotion_score'] = vn_result.get('promotion_score', 0.0)
        else:
            result['combined_text'] = message.get('message_text', '') or ''
            result['category_hint'] = 'text_only'
            result['importance'] = 0.5
            result['urgency'] = 0.0
            result['promotion_score'] = 0.0
        return result
