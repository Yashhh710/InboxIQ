import csv
import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class DatasetContext:
    users: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    groups: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    group_members: Dict[tuple, Dict[str, Any]] = field(default_factory=dict)
    business_accounts: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    user_business_history: Dict[tuple, Dict[str, Any]] = field(default_factory=dict)
    message_history: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    message_events: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    user_message_events: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    images: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    voice_notes: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    daily_notification_summary: Dict[tuple, Dict[str, Any]] = field(default_factory=dict)
    user_group_memberships: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    user_business_relationships: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    group_user_members: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    business_user_history: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    history_by_user: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    history_by_sender_user: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    history_by_group: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    history_by_business: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)


class ContextLoader:
    def __init__(self, dataset_dir: str):
        self.dataset_dir = dataset_dir
        self.context = DatasetContext()

    def load(self) -> DatasetContext:
        self._load_users()
        self._load_groups()
        self._load_group_members()
        self._load_business_accounts()
        self._load_user_business_history()
        self._load_message_history()
        self._load_message_events()
        self._load_images()
        self._load_voice_notes()
        self._load_daily_notification_summary()
        self._build_indexes()
        return self.context

    def _read_csv(self, filename: str) -> List[Dict[str, Any]]:
        path = os.path.join(self.dataset_dir, filename)
        rows = []
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)
        return rows

    def _load_users(self):
        for row in self._read_csv('users.csv'):
            self.context.users[row['user_id']] = row

    def _load_groups(self):
        for row in self._read_csv('groups.csv'):
            self.context.groups[row['group_id']] = row

    def _load_group_members(self):
        for row in self._read_csv('group_members.csv'):
            key = (row['group_id'], row['user_id'])
            self.context.group_members[key] = row
            uid = row['user_id']
            gid = row['group_id']
            if uid not in self.context.user_group_memberships:
                self.context.user_group_memberships[uid] = []
            self.context.user_group_memberships[uid].append(row)
            if gid not in self.context.group_user_members:
                self.context.group_user_members[gid] = []
            self.context.group_user_members[gid].append(row)

    def _load_business_accounts(self):
        for row in self._read_csv('business_accounts.csv'):
            self.context.business_accounts[row['business_id']] = row

    def _load_user_business_history(self):
        for row in self._read_csv('user_business_history.csv'):
            key = (row['user_id'], row['business_id'])
            self.context.user_business_history[key] = row
            uid = row['user_id']
            bid = row['business_id']
            if uid not in self.context.user_business_relationships:
                self.context.user_business_relationships[uid] = []
            self.context.user_business_relationships[uid].append(row)
            if bid not in self.context.business_user_history:
                self.context.business_user_history[bid] = []
            self.context.business_user_history[bid].append(row)

    def _load_message_history(self):
        for row in self._read_csv('message_history.csv'):
            self.context.message_history[row['message_id']] = row
            uid = row['user_id']
            suid = row.get('sender_user_id', '')
            gid = row.get('group_id', '')
            bid = row.get('business_id', '')
            if uid not in self.context.history_by_user:
                self.context.history_by_user[uid] = []
            self.context.history_by_user[uid].append(row)
            if suid:
                if suid not in self.context.history_by_sender_user:
                    self.context.history_by_sender_user[suid] = []
                self.context.history_by_sender_user[suid].append(row)
            if gid:
                if gid not in self.context.history_by_group:
                    self.context.history_by_group[gid] = []
                self.context.history_by_group[gid].append(row)
            if bid:
                if bid not in self.context.history_by_business:
                    self.context.history_by_business[bid] = []
                self.context.history_by_business[bid].append(row)

    def _load_message_events(self):
        for row in self._read_csv('message_events.csv'):
            self.context.message_events[row['message_id']] = row
            uid = row['user_id']
            if uid not in self.context.user_message_events:
                self.context.user_message_events[uid] = []
            self.context.user_message_events[uid].append(row)

    def _load_images(self):
        for row in self._read_csv('images.csv'):
            self.context.images[row['image_id']] = row

    def _load_voice_notes(self):
        for row in self._read_csv('voice_notes.csv'):
            self.context.voice_notes[row['voice_note_id']] = row

    def _load_daily_notification_summary(self):
        for row in self._read_csv('daily_notification_summary.csv'):
            key = (row['user_id'], row['date'])
            self.context.daily_notification_summary[key] = row

    def _build_indexes(self):
        pass


def load_messages(dataset_dir: str) -> List[Dict[str, Any]]:
    path = os.path.join(dataset_dir, 'messages.csv')
    rows = []
    with open(path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def write_output(dataset_dir: str, predictions: List[Dict[str, Any]]):
    output_path = os.path.join(dataset_dir, 'output.csv')
    fieldnames = ['message_id', 'action', 'message_type', 'reason', 'confidence', 'evidence_message_ids']
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for p in predictions:
            writer.writerow({
                'message_id': p['message_id'],
                'action': p['action'],
                'message_type': p['message_type'],
                'reason': p['reason'],
                'confidence': p['confidence'],
                'evidence_message_ids': p['evidence_message_ids']
            })
