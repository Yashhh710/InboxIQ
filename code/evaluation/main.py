import csv
import os
import sys
from typing import Dict, Any, List, Tuple


VALID_ACTIONS = {'notify', 'digest', 'mute'}
VALID_TYPES = {'personal', 'urgent', 'event', 'payment', 'business_update',
               'promotion', 'greeting', 'forward', 'spam', 'scam', 'unknown'}


def validate_format(output_path: str, messages_path: str) -> Tuple[bool, Dict[str, Any]]:
    issues = []
    with open(output_path, encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    with open(messages_path, encoding='utf-8') as f:
        inp_ids = {r['message_id'] for r in csv.DictReader(f)}

    info = {}
    info['rows'] = len(rows)
    info['expected_rows'] = len(inp_ids)

    headers = list(rows[0].keys()) if rows else []
    required = ['message_id', 'action', 'message_type', 'reason', 'confidence', 'evidence_message_ids']
    info['headers'] = headers
    info['missing_cols'] = [h for h in required if h not in headers]
    info['extra_cols'] = [h for h in headers if h not in required]

    bad_action = []
    bad_type = []
    bad_conf = []
    empty_reason = []
    out_ids = set()
    for r in rows:
        out_ids.add(r['message_id'])
        if r['action'] not in VALID_ACTIONS:
            bad_action.append(r['message_id'])
        if r['message_type'] not in VALID_TYPES:
            bad_type.append((r['message_id'], r['message_type']))
        try:
            c = float(r['confidence'])
            if c < 0 or c > 1:
                bad_conf.append((r['message_id'], r['confidence']))
        except Exception:
            bad_conf.append((r['message_id'], r['confidence']))
        if not r['reason'] or len(str(r['reason']).strip()) < 5:
            empty_reason.append(r['message_id'])

    info['bad_action'] = bad_action
    info['bad_type'] = bad_type
    info['bad_conf'] = bad_conf
    info['empty_reason'] = empty_reason
    info['missing_in_output'] = inp_ids - out_ids
    info['extra_in_output'] = out_ids - inp_ids

    ok = (
        len(rows) == len(inp_ids) and
        not info['missing_cols'] and not info['extra_cols'] and
        not bad_action and not bad_type and not bad_conf and not empty_reason and
        not info['missing_in_output'] and not info['extra_in_output']
    )
    return ok, info


def reason_score(reason: str) -> float:
    keywords = [
        'trusted admin', 'time-sensitive', 'interrupt', 'immediately',
        'verified business', 'order history', 'matches the user',
        'work context', 'deadline', 'meeting dependency',
        'promotional but matches', 'opted into',
        'useful group information', 'not urgent enough',
        'harmless greeting', 'can be read later',
        'sender is trusted', 'no urgent action', 'safety relevance',
        'legitimate but does not require',
        'offer is potentially relevant',
        'pattern of repeated forwards', 'user usually ignores',
        'opted out of or repeatedly dismissed', 'marketing messages',
        'similar historical messages were ignored',
        'asks for urgent OTP', 'account verification through a suspicious flow',
        'fake support language', 'account-blocking pressure',
        'first message from the sender', 'sensitive verification',
        'tries to instruct the router', 'based on the actual content',
        'payment reminder', 'near-term deadline', 'late-fee risk',
        'matches an active user bill', 'muted group', 'admin sent urgent safety',
        'same-day operational update',
    ]
    r = reason.lower()
    hit = sum(1 for k in keywords if k in r)
    if len(reason) < 20:
        return 0.2
    if len(reason) > 200:
        return min(1.0, 0.4 + hit * 0.08)
    return min(1.0, 0.5 + hit * 0.08)


def evidence_score(evidence: str, message_id: str, user_id: str,
                   history: Dict[str, Dict[str, Any]]) -> float:
    if evidence == 'none' or not evidence:
        return 0.3
    ids = [e for e in evidence.split(';') if e]
    if not ids:
        return 0.2
    relevant = 0
    for eid in ids:
        h = history.get(eid)
        if h and h.get('user_id') == user_id:
            relevant += 1
            if h.get('sender_user_id') or h.get('group_id') or h.get('business_id'):
                relevant += 0.5
    if relevant == 0:
        return 0.1
    return min(1.0, 0.5 + 0.2 * relevant / max(1, len(ids)))


def confidence_calibration_score(confidences: List[Tuple[float, str]]) -> float:
    high = [c for c, a in confidences if c >= 0.9]
    medium = [c for c, a in confidences if 0.7 <= c < 0.9]
    low = [c for c, a in confidences if c < 0.7]
    if not confidences:
        return 0.5
    score = 0.0
    if 0.1 <= len(high) / len(confidences) <= 0.6:
        score += 0.4
    else:
        score += 0.2
    if 0.2 <= len(medium) / len(confidences) <= 0.7:
        score += 0.2
    if len(low) / len(confidences) <= 0.3:
        score += 0.2
    if all(0.5 <= c <= 0.99 for c, _ in confidences):
        score += 0.2
    return min(1.0, score)


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_dir))
    dataset_dir = os.path.join(project_root, 'dataset')
    if not os.path.isdir(dataset_dir):
        dataset_dir = os.path.join(os.getcwd(), 'dataset')
        if not os.path.isdir(dataset_dir):
            for d in [current_dir, project_root]:
                if os.path.isdir(os.path.join(d, 'dataset')):
                    dataset_dir = os.path.join(d, 'dataset')
                    break

    output_path = os.path.join(dataset_dir, 'output.csv')
    messages_path = os.path.join(dataset_dir, 'messages.csv')
    history_path = os.path.join(dataset_dir, 'message_history.csv')
    sample_path = os.path.join(dataset_dir, 'sample_messages.csv')

    if not os.path.exists(output_path):
        print(f"ERROR: {output_path} does not exist. Run code/main.py first.")
        return 1

    ok, info = validate_format(output_path, messages_path)
    print('=' * 70)
    print('FORMAT VALIDATION')
    print('=' * 70)
    print(f"  Rows: {info['rows']} / {info['expected_rows']}")
    print(f"  Headers: {info['headers']}")
    if info['missing_cols']:
        print(f"  [X] Missing columns: {info['missing_cols']}")
    if info['extra_cols']:
        print(f"  [!] Extra columns: {info['extra_cols']}")
    if info['bad_action']:
        print(f"  [X] Invalid actions: {len(info['bad_action'])}")
    if info['bad_type']:
        print(f"  [X] Invalid types: {len(info['bad_type'])}")
    if info['bad_conf']:
        print(f"  [X] Invalid confidence: {len(info['bad_conf'])}")
    if info['empty_reason']:
        print(f"  [X] Empty reasons: {len(info['empty_reason'])}")
    if info['missing_in_output']:
        print(f"  [X] Missing IDs: {info['missing_in_output']}")
    if info['extra_in_output']:
        print(f"  [!] Extra IDs: {info['extra_in_output']}")
    print(f"  Overall format: {'PASS' if ok else 'FAIL'}")

    with open(output_path, encoding='utf-8') as f:
        preds = {r['message_id']: r for r in csv.DictReader(f)}
    with open(messages_path, encoding='utf-8') as f:
        messages = {r['message_id']: r for r in csv.DictReader(f)}
    with open(history_path, encoding='utf-8') as f:
        history = {r['message_id']: r for r in csv.DictReader(f)}

    reasons_s = []
    evidence_s = []
    confidences = []
    for mid, p in preds.items():
        reasons_s.append(reason_score(p['reason']))
        uid = messages.get(mid, {}).get('user_id', '')
        evidence_s.append(evidence_score(
            p['evidence_message_ids'], mid, uid, history))
        confidences.append((float(p['confidence']), p['action']))

    avg_reason = sum(reasons_s) / len(reasons_s) if reasons_s else 0
    avg_evidence = sum(evidence_s) / len(evidence_s) if evidence_s else 0
    conf_calib = confidence_calibration_score(confidences)

    action_counts = {'notify': 0, 'digest': 0, 'mute': 0}
    type_counts = {}
    for p in preds.values():
        action_counts[p['action']] = action_counts.get(p['action'], 0) + 1
        mt = p['message_type']
        type_counts[mt] = type_counts.get(mt, 0) + 1

    print()
    print('=' * 70)
    print('QUALITY METRICS (heuristic)')
    print('=' * 70)
    print(f"  Reason usefulness (avg)      : {avg_reason:.3f}  (target >0.70)")
    print(f"  Evidence relevance (avg)     : {avg_evidence:.3f}  (target >0.60)")
    print(f"  Confidence calibration score : {conf_calib:.3f}  (target >0.70)")
    print()
    print(f"  Action distribution: {action_counts}")
    print(f"  Message type distribution: {type_counts}")
    conf_values = [c for c, _ in confidences]
    print(f"  Confidence min={min(conf_values):.2f} avg={sum(conf_values)/len(conf_values):.2f} max={max(conf_values):.2f}")

    sample_based = 0.0
    if os.path.exists(sample_path):
        with open(sample_path, encoding='utf-8') as f:
            samples = list(csv.DictReader(f))
        sim = 0.0
        n = 0
        for s in samples:
            sact = s['action']
            stype = s['message_type']
            s_reason_style = s['reason'][:80].lower()
            for mid, p in preds.items():
                mtext = messages.get(mid, {}).get('message_text', '').lower()
                stext = s['message_text'].lower()
                if len(mtext) < 10 or len(stext) < 10:
                    continue
                words_s = set(stext.split())
                words_m = set(mtext.split())
                inter = words_s & words_m
                union = words_s | words_m
                if inter and len(union) > 0:
                    jac = len(inter) / len(union)
                    if jac > 0.4:
                        n += 1
                        ss = 0.0
                        if p['action'] == sact:
                            ss += 0.5
                        if p['message_type'] == stype:
                            ss += 0.3
                        style_kw = ['trusted admin', 'verified business', 'work context',
                                    'pattern of repeated', 'opted out', 'urgent OTP',
                                    'payment reminder', 'same-day operational']
                        preason = p['reason'].lower()
                        if any(k in preason for k in style_kw) or any(k in s_reason_style for k in style_kw):
                            ss += 0.1
                        sim += min(1.0, ss)
        if n > 0:
            sample_based = sim / max(1, n)
            print()
            print(f"  Sample-based alignment score : {sample_based:.3f}  (over {n} matches)")

    format_score = 1.0 if ok else 0.0
    overall = (
        0.25 * format_score +
        0.20 * avg_reason +
        0.15 * avg_evidence +
        0.15 * conf_calib +
        0.25 * sample_based
    )
    print()
    print('=' * 70)
    print(f"  COMPOSITE QUALITY SCORE (heuristic): {overall:.3f} / 1.000")
    print('=' * 70)
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
