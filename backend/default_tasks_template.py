# nativarrry（ネイティバリー）デフォルトタスクテンプレート
# ネイティブアプリ申請手順のデフォルトタスクテンプレート

DEFAULT_PHASES = [
    {
        "phase_number": 1,
        "phase_name": "アカウント登録",
        "description": "開発者アカウントの登録と初期設定",
        "tasks": [
            {
                "step_number": "1.1",
                "title": "アカウント登録",
                "description": "開発者アカウントの登録手続き",
                "estimated_days": "1-2日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "組織としてApple IDを登録し、Apple Developer Programへ登録する（DUNSナンバー取得が必須）。登録料: 年額99ドル (約16,500円)",
                "android_specific": "Google Play Developer登録。登録料: 25ドル (約3,600円)",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "1.2",
                "title": "登録料の支払い",
                "description": "デベロッパー登録料の支払い",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "",
                "android_specific": "",
                "priority": "high",
                "order": 2
            },
            {
                "step_number": "1.3",
                "title": "組織のデベロッパーアカウント作成",
                "description": "法人として登録する場合の手続き",
                "estimated_days": "1-2週間",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "法人確認で登記簿謄本等の書類提出が必要",
                "android_specific": "",
                "priority": "high",
                "order": 3
            },
            {
                "step_number": "1.4",
                "title": "デベロッパー名設定",
                "description": "ストアに表示される開発者名の設定",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "後から変更可能だが、一度公開するとユーザーの目に触れるため、適切な名前を設定する（例：「公式」など）。DUNS番号との関連性も考慮",
                "android_specific": "",
                "priority": "medium",
                "order": 4
            }
        ]
    },
    {
        "phase_number": 2,
        "phase_name": "アプリ情報準備・メタデータ入力",
        "description": "アプリストアに掲載するための情報準備",
        "tasks": [
            {
                "step_number": "2.1",
                "title": "アプリ情報入力",
                "description": "アプリ名、説明、カテゴリ、スクリーンショット等の情報入力",
                "estimated_days": "1-3日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "アプリ名、バンドルID、カテゴリ、年齢制限の有無、アプリアイコン、スクリーンショット4枚以上、説明文、プライバシーポリシーと設置URL、バージョン号、ビルド番号",
                "android_specific": "アプリ名 (50文字以内)、パッケージ名 (50文字以内)、ユニーク Graphic (横長画像 1024x500)、スクリーンショット (4000文字以内)、プライバシーポリシーと設置URL",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "2.2",
                "title": "デモ動画準備",
                "description": "審査用のアプリデモンストレーション動画の準備",
                "estimated_days": "1-2日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "必須 (レビューワーがアプリを十分検証できない場合)",
                "android_specific": "",
                "priority": "medium",
                "order": 2
            },
            {
                "step_number": "2.3",
                "title": "テストアカウント準備",
                "description": "審査用のテストアカウントの作成",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "レビューワーがアプリを検証するためのテストアカウント",
                "android_specific": "",
                "priority": "high",
                "order": 3
            },
            {
                "step_number": "2.4",
                "title": "暗号化の有無申告",
                "description": "export compliance: 暗号化の有無を申告",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "export compliance設定",
                "android_specific": "",
                "priority": "medium",
                "order": 4
            }
        ]
    },
    {
        "phase_number": 3,
        "phase_name": "アプリビルド",
        "description": "アプリケーションのビルド作業",
        "tasks": [
            {
                "step_number": "3.1",
                "title": "アプリビルド",
                "description": "アプリケーションのビルド実行",
                "estimated_days": "1-3日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "通常 Xcode を使用 (IPAファイル)",
                "android_specific": "通常 Android Studio を使用 (AAB形式)",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "3.2",
                "title": "ビルドツール選定",
                "description": "使用するビルドツールの選定と準備",
                "estimated_days": "検討中",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "",
                "android_specific": "ビルド化ツールは比較検討中",
                "priority": "medium",
                "order": 2
            }
        ]
    },
    {
        "phase_number": 4,
        "phase_name": "アプリアップロード",
        "description": "ビルドしたアプリのストアへのアップロード",
        "tasks": [
            {
                "step_number": "4.1",
                "title": "ビルドファイルアップロード",
                "description": "ビルドしたアプリファイルをストアにアップロード",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "Archive化する。IPAファイル",
                "android_specific": "AABファイル",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "4.2",
                "title": "バージョン番号・ビルド番号設定",
                "description": "アプリのバージョン情報の設定",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "必須",
                "android_specific": "必須",
                "priority": "high",
                "order": 2
            }
        ]
    },
    {
        "phase_number": 5,
        "phase_name": "テストトラック設定",
        "description": "テスト配信環境の設定",
        "tasks": [
            {
                "step_number": "5.1",
                "title": "テストトラック設定",
                "description": "クローズドテストの設定と実施",
                "estimated_days": "1-2日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "TestFlight を利用",
                "android_specific": "Closed Testing (クローズドテスト) -> 開発者、テスター。最低12人以上が14日間オプトイン。バグ・フィードバック収集",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "5.2",
                "title": "テスト環境構築",
                "description": "テスト環境の準備とテスターの招待",
                "estimated_days": "",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "TestFlight を利用",
                "android_specific": "",
                "priority": "high",
                "order": 2
            }
        ]
    },
    {
        "phase_number": 6,
        "phase_name": "審査申請",
        "description": "ストア審査への申請準備と提出",
        "tasks": [
            {
                "step_number": "6.1",
                "title": "審査用設定",
                "description": "審査に必要な各種設定の完了",
                "estimated_days": "1-2日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "",
                "android_specific": "コンテンツレーティングアンケートの提出、Pricing and Distributionを設定",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "6.2",
                "title": "審査請求",
                "description": "審査の正式な申請",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "提出後はステータスが'Waiting for Review'となる",
                "android_specific": "",
                "priority": "high",
                "order": 2
            },
            {
                "step_number": "6.3",
                "title": "審査用メモ入力",
                "description": "審査担当者向けのメモや注意事項の記入",
                "estimated_days": "",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "テストアカウント情報、アプリの挙動で特に確認してほしい点などを記載",
                "android_specific": "",
                "priority": "medium",
                "order": 3
            },
            {
                "step_number": "6.4",
                "title": "プライバシーポリシー確認",
                "description": "プライバシーポリシーの最終確認",
                "estimated_days": "",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "必ずWebで公開してリンクを設定",
                "android_specific": "",
                "priority": "high",
                "order": 4
            }
        ]
    },
    {
        "phase_number": 7,
        "phase_name": "審査プロセス",
        "description": "ストア側による審査",
        "tasks": [
            {
                "step_number": "7.1",
                "title": "レビュー",
                "description": "Apple/Googleによるアプリ審査",
                "estimated_days": "平均 2～7日 (場合により10日以上)",
                "assigned_to": "Apple/Google",
                "checklist": [],
                "ios_specific": "初回提出の場合、状況によってはもっとかかることもあります",
                "android_specific": "",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "7.2",
                "title": "リジェクト対応",
                "description": "リジェクトされた場合の対応準備",
                "estimated_days": "",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "審査が通ればストアでの公開設定を行います。自動公開、公開日時指定も可能",
                "android_specific": "審査が通ればストアでの公開設定を行います。自動公開、公開日時指定も可能",
                "priority": "medium",
                "order": 2
            }
        ]
    },
    {
        "phase_number": 8,
        "phase_name": "リジェクト対応・再審査",
        "description": "リジェクトされた場合の対応フロー",
        "tasks": [
            {
                "step_number": "8.1",
                "title": "リジェクト通知確認",
                "description": "リジェクト通知の内容確認",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "リジェクト(却下)となった場合、理由がApp Store Connect上に英語で通知されます",
                "android_specific": "",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "8.2",
                "title": "リジェクト理由精査",
                "description": "リジェクト理由の分析と原因特定",
                "estimated_days": "1-3日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "通知された内容を精査し、原因を特定します",
                "android_specific": "",
                "priority": "high",
                "order": 2
            },
            {
                "step_number": "8.3",
                "title": "修正対応",
                "description": "リジェクト理由に基づいた修正作業",
                "estimated_days": "1-5日",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "リジェクト理由に基づいた修正を行います",
                "android_specific": "",
                "priority": "high",
                "order": 3
            },
            {
                "step_number": "8.4",
                "title": "再申請",
                "description": "修正後の再度審査申請",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "修正後、再度審査を申請します",
                "android_specific": "",
                "priority": "high",
                "order": 4
            }
        ]
    },
    {
        "phase_number": 9,
        "phase_name": "公開",
        "description": "アプリの公開とリリース後の対応",
        "tasks": [
            {
                "step_number": "9.1",
                "title": "公開設定",
                "description": "ストアでの公開設定",
                "estimated_days": "即時",
                "assigned_to": "開発者",
                "checklist": [],
                "ios_specific": "審査通過後、ストアでの公開設定を行います。自動公開、公開日時指定も可能です",
                "android_specific": "",
                "priority": "high",
                "order": 1
            },
            {
                "step_number": "9.2",
                "title": "公開",
                "description": "アプリの正式リリース",
                "estimated_days": "即時",
                "assigned_to": "Apple/Google",
                "checklist": [],
                "ios_specific": "ユーザーからの評価やフィードバックをモニタリングし、問題があればアップデートを準備します",
                "android_specific": "",
                "priority": "high",
                "order": 2
            }
        ]
    }
]


def get_default_tasks_for_platform(platform: str) -> list:
    """
    プラットフォームに応じたデフォルトタスクを返す
    
    Args:
        platform: "iOS", "Android", または "Both"
    
    Returns:
        デフォルトタスクのリスト
    """
    tasks = []
    
    for phase in DEFAULT_PHASES:
        for task in phase["tasks"]:
            # プラットフォームに応じてタスクをフィルタリング
            if platform == "Both":
                # 両方のプラットフォームの場合はすべてのタスクを含める
                tasks.append({
                    **task,
                    "phase": phase["phase_name"],
                    "phase_number": phase["phase_number"]
                })
            elif platform == "iOS":
                # iOSの場合はiOS固有の情報があるタスクまたは共通タスク
                if task["ios_specific"] or (not task["ios_specific"] and not task["android_specific"]):
                    tasks.append({
                        **task,
                        "phase": phase["phase_name"],
                        "phase_number": phase["phase_number"],
                        "platform_specific": task["ios_specific"]
                    })
            elif platform == "Android":
                # Androidの場合はAndroid固有の情報があるタスクまたは共通タスク
                if task["android_specific"] or (not task["ios_specific"] and not task["android_specific"]):
                    tasks.append({
                        **task,
                        "phase": phase["phase_name"],
                        "phase_number": phase["phase_number"],
                        "platform_specific": task["android_specific"]
                    })
    
    return tasks


def get_phases_summary() -> list:
    """
    すべてのフェーズの概要情報を返す
    
    Returns:
        フェーズ概要のリスト
    """
    return [
        {
            "phase_number": phase["phase_number"],
            "phase_name": phase["phase_name"],
            "description": phase["description"],
            "task_count": len(phase["tasks"])
        }
        for phase in DEFAULT_PHASES
    ]
