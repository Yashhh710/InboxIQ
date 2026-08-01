import os
import sys


def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    dataset_dir = os.path.join(project_root, 'dataset')
    sys.path.insert(0, current_dir)

    from engines.notification_router import NotificationRouter

    if not os.path.isdir(dataset_dir):
        alt = os.path.join(current_dir, 'dataset')
        if os.path.isdir(alt):
            dataset_dir = alt
        else:
            for d in [os.getcwd(), project_root, os.path.join(os.getcwd(), 'hackerrank-orchestrate-august26-main', 'dataset')]:
                if os.path.isdir(os.path.join(d, 'dataset')):
                    dataset_dir = os.path.join(d, 'dataset')
                    break
                if os.path.isdir(d) and any(f.endswith('.csv') for f in os.listdir(d)):
                    dataset_dir = d
                    break

    router = NotificationRouter(dataset_dir)
    predictions = router.generate_output()
    print(f"Generated {len(predictions)} predictions.")
    counts = {'notify': 0, 'digest': 0, 'mute': 0}
    types = {}
    for p in predictions:
        counts[p['action']] = counts.get(p['action'], 0) + 1
        mt = p['message_type']
        types[mt] = types.get(mt, 0) + 1
    print(f"Actions: {counts}")
    print(f"Types: {types}")
    output_path = os.path.join(dataset_dir, 'output.csv')
    print(f"Output written to: {output_path}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
