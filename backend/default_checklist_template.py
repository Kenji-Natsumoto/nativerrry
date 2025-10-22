# nativarrry（ネイティバリー）デフォルトチェックリストテンプレート

DEFAULT_CHECKLIST_IOS = [
    {
        "title": "アプリ名",
        "description": "App Storeに表示されるアプリケーション名",
        "platform": "iOS",
        "category": "basic_info",
        "order": 1
    },
    {
        "title": "バンドルID",
        "description": "アプリケーションの一意な識別子（例: com.company.appname）",
        "platform": "iOS",
        "category": "basic_info",
        "order": 2
    },
    {
        "title": "カテゴリ",
        "description": "App Storeのカテゴリ選択",
        "platform": "iOS",
        "category": "basic_info",
        "order": 3
    },
    {
        "title": "年齢制限",
        "description": "年齢制限の有無と内容",
        "platform": "iOS",
        "category": "basic_info",
        "order": 4
    },
    {
        "title": "アプリアイコン",
        "description": "1024x1024pxのアプリアイコン",
        "platform": "iOS",
        "category": "assets",
        "order": 5
    },
    {
        "title": "スクリーンショット",
        "description": "各デバイスサイズごとに4枚以上のスクリーンショット",
        "platform": "iOS",
        "category": "assets",
        "order": 6
    },
    {
        "title": "説明文",
        "description": "アプリの詳細説明",
        "platform": "iOS",
        "category": "content",
        "order": 7
    },
    {
        "title": "プライバシーポリシー",
        "description": "プライバシーポリシーと設置URL",
        "platform": "iOS",
        "category": "legal",
        "order": 8
    },
    {
        "title": "バージョン番号",
        "description": "アプリのバージョン番号（例: 1.0.0）",
        "platform": "iOS",
        "category": "technical",
        "order": 9
    },
    {
        "title": "ビルド番号",
        "description": "ビルド番号（例: 1）",
        "platform": "iOS",
        "category": "technical",
        "order": 10
    },
    {
        "title": "テストアカウント",
        "description": "審査用のテストアカウント情報",
        "platform": "iOS",
        "category": "review",
        "order": 11
    },
    {
        "title": "デモ動画",
        "description": "アプリのデモンストレーション動画（必要に応じて）",
        "platform": "iOS",
        "category": "assets",
        "order": 12
    },
    {
        "title": "暗号化の有無",
        "description": "Export Compliance: 暗号化の使用有無",
        "platform": "iOS",
        "category": "legal",
        "order": 13
    }
]

DEFAULT_CHECKLIST_ANDROID = [
    {
        "title": "アプリ名",
        "description": "Google Playに表示されるアプリケーション名（50文字以内）",
        "platform": "Android",
        "category": "basic_info",
        "order": 1
    },
    {
        "title": "パッケージ名",
        "description": "アプリケーションの一意な識別子（例: com.company.appname）",
        "platform": "Android",
        "category": "basic_info",
        "order": 2
    },
    {
        "title": "カテゴリ",
        "description": "Google Playのカテゴリ選択",
        "platform": "Android",
        "category": "basic_info",
        "order": 3
    },
    {
        "title": "アプリアイコン",
        "description": "512x512pxのアプリアイコン（PNG形式）",
        "platform": "Android",
        "category": "assets",
        "order": 4
    },
    {
        "title": "Feature Graphic",
        "description": "1024x500pxの横長画像（JPGまたはPNG形式）",
        "platform": "Android",
        "category": "assets",
        "order": 5
    },
    {
        "title": "スクリーンショット",
        "description": "各デバイスタイプごとに2〜8枚のスクリーンショット",
        "platform": "Android",
        "category": "assets",
        "order": 6
    },
    {
        "title": "簡単な説明",
        "description": "80文字以内の短い説明",
        "platform": "Android",
        "category": "content",
        "order": 7
    },
    {
        "title": "詳細説明",
        "description": "4000文字以内の詳細説明",
        "platform": "Android",
        "category": "content",
        "order": 8
    },
    {
        "title": "プライバシーポリシー",
        "description": "プライバシーポリシーと設置URL",
        "platform": "Android",
        "category": "legal",
        "order": 9
    },
    {
        "title": "コンテンツレーティング",
        "description": "コンテンツレーティングアンケートの回答",
        "platform": "Android",
        "category": "legal",
        "order": 10
    }
]


def get_default_checklist_for_platform(platform: str) -> list:
    """
    プラットフォームに応じたデフォルトチェックリストを返す
    
    Args:
        platform: "iOS", "Android", または "Both"
    
    Returns:
        デフォルトチェックリストのリスト
    """
    if platform == "iOS":
        return DEFAULT_CHECKLIST_IOS
    elif platform == "Android":
        return DEFAULT_CHECKLIST_ANDROID
    elif platform == "Both":
        return DEFAULT_CHECKLIST_IOS + DEFAULT_CHECKLIST_ANDROID
    else:
        return []
