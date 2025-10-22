# nativarrry（ネイティバリー） - フェーズ1 設計書

## 概要
ネイティブアプリ申請支援ツール「nativarrry（ネイティバリー）」のタスク管理とスケジュール機能の設計

## 新機能要件

### 1. デフォルトタスクの自動組み込み
- プロジェクト作成時に、選択されたプラットフォーム（iOS/Android/Both）に応じたデフォルトタスクを自動生成
- 9つのフェーズ、合計26のステップで構成
- 各タスクにはステップ番号、タイトル、説明、所要日数、担当者、プラットフォーム固有情報を含む

### 2. タスクチェックリスト機能
- 各タスクを完了/未完了で管理
- タスクごとにメモ/ノートを追加可能
- 完了日時の記録

### 3. スケジュール管理機能
- プロジェクトごとに「ネイティブ申請開始日」を設定
- プロジェクトごとに「公開日（目標）」を設定
- スケジュールの可視化

---

## データモデル設計

### Project（既存モデルの拡張）

```python
class Project(BaseModel):
    id: str
    name: str
    platform: str  # "iOS", "Android", "Both"
    description: Optional[str]
    status: str  # "active", "submitted", "approved", "rejected"
    
    # 新規追加フィールド
    start_date: Optional[datetime] = None  # ネイティブ申請開始日
    publish_date: Optional[datetime] = None  # 公開日（目標）
    
    created_at: datetime
    updated_at: datetime
```

**追加フィールド説明:**
- `start_date`: ネイティブ申請プロセスの開始予定日
- `publish_date`: アプリを公開したい目標日

---

### Task（既存モデルの拡張）

```python
class Task(BaseModel):
    id: str
    project_id: str
    title: str
    description: Optional[str]
    
    # 既存フィールド（継続使用）
    phase: str  # フェーズ名（例: "アカウント登録"）
    status: str  # "pending", "in_progress", "completed"
    due_date: Optional[datetime]
    priority: str  # "low", "medium", "high"
    
    # 新規追加フィールド
    completed: bool = False  # 完了フラグ
    memo: Optional[str] = None  # メモ/ノート
    step_number: Optional[str] = None  # ステップ番号（例: "1.1", "2.3"）
    phase_number: Optional[int] = None  # フェーズ番号（1-9）
    estimated_days: Optional[str] = None  # 所要日数（例: "1-3日", "即時"）
    assigned_to: Optional[str] = None  # 担当者（例: "開発者", "Apple/Google"）
    platform_specific: Optional[str] = None  # プラットフォーム固有情報
    order: int = 0  # フェーズ内での表示順序
    is_default: bool = False  # デフォルトタスクかどうか
    
    completed_at: Optional[datetime]
    created_at: datetime
```

**追加フィールド説明:**
- `completed`: タスクの完了状態（True/False）
- `memo`: ユーザーが自由に入力できるメモ欄
- `step_number`: PDFから抽出したステップ番号（例: "1.1"）
- `phase_number`: フェーズ番号（1-9）で、フェーズごとのソートに使用
- `estimated_days`: タスクの所要日数の目安
- `assigned_to`: タスクの担当者
- `platform_specific`: iOS/Android固有の注意事項や詳細
- `order`: 同じフェーズ内でのタスクの表示順序
- `is_default`: デフォルトで生成されたタスクかどうかのフラグ

---

## API設計

### 1. プロジェクト作成時のデフォルトタスク自動生成

**エンドポイント:** `POST /api/projects`

**拡張仕様:**
- プロジェクト作成時に、`auto_generate_tasks`パラメータ（デフォルト: true）を追加
- プラットフォームに応じたデフォルトタスクを自動生成

```python
class ProjectCreate(BaseModel):
    name: str
    platform: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    publish_date: Optional[datetime] = None
    auto_generate_tasks: bool = True  # 新規追加
```

---

### 2. 既存プロジェクトへのデフォルトタスク追加

**エンドポイント:** `POST /api/projects/{project_id}/generate-default-tasks`

**説明:** 
既存のプロジェクトに対して、デフォルトタスクを生成する

**レスポンス:**
```json
{
  "message": "デフォルトタスクを生成しました",
  "tasks_created": 26
}
```

---

### 3. タスクの完了状態更新

**エンドポイント:** `PATCH /api/tasks/{task_id}/complete`

**リクエストボディ:**
```json
{
  "completed": true
}
```

**レスポンス:**
```json
{
  "id": "task_id",
  "completed": true,
  "completed_at": "2025-01-15T10:30:00Z"
}
```

---

### 4. タスクメモの更新

**エンドポイント:** `PATCH /api/tasks/{task_id}/memo`

**リクエストボディ:**
```json
{
  "memo": "App Store Connectのアカウント設定完了。DUNSナンバーは既に取得済み。"
}
```

---

### 5. プロジェクトスケジュール更新

**エンドポイント:** `PATCH /api/projects/{project_id}/schedule`

**リクエストボディ:**
```json
{
  "start_date": "2025-02-01T00:00:00Z",
  "publish_date": "2025-03-15T00:00:00Z"
}
```

---

### 6. フェーズ一覧取得

**エンドポイント:** `GET /api/phases`

**レスポンス:**
```json
[
  {
    "phase_number": 1,
    "phase_name": "アカウント登録",
    "description": "開発者アカウントの登録と初期設定",
    "task_count": 4
  },
  ...
]
```

---

### 7. プロジェクトのタスク一覧（フェーズ別）

**エンドポイント:** `GET /api/projects/{project_id}/tasks`

**クエリパラメータ:**
- `phase_number`: フェーズ番号でフィルタ（オプション）
- `completed`: 完了状態でフィルタ（true/false/all、デフォルト: all）

**レスポンス:**
```json
{
  "project_id": "xxx",
  "tasks_by_phase": [
    {
      "phase_number": 1,
      "phase_name": "アカウント登録",
      "tasks": [
        {
          "id": "task_id",
          "step_number": "1.1",
          "title": "アカウント登録",
          "completed": false,
          "memo": "",
          ...
        }
      ]
    }
  ]
}
```

---

## フロントエンド設計

### 1. Dashboard.js の拡張
- プロジェクト作成フォームにスケジュール日付フィールドを追加
  - 開始日（start_date）
  - 公開日（publish_date）

### 2. ProjectDetail.js の拡張

#### 2.1 新規タブ: "スケジュール"
- プロジェクトの開始日と公開日の表示・編集
- 各フェーズの進捗率の可視化
- タイムライン表示（簡易版）

#### 2.2 "タスク"タブの拡張
- フェーズごとにタスクをグループ化して表示
- 各タスクにチェックボックス（完了/未完了）
- メモ入力欄（クリックで展開）
- ステップ番号、所要日数、担当者の表示
- プラットフォーム固有情報の表示（iOS/Android別）

#### 2.3 UIコンポーネント
- Accordion（折りたたみ）でフェーズごとにタスクをグループ化
- Checkbox for task completion
- Textarea for memo
- Badge for priority and status
- Progress bar for phase completion

---

## デフォルトタスクテンプレート

### フェーズ構成
1. アカウント登録（4タスク）
2. アプリ情報準備・メタデータ入力（4タスク）
3. アプリビルド（2タスク）
4. アプリアップロード（2タスク）
5. テストトラック設定（2タスク）
6. 審査申請（4タスク）
7. 審査プロセス（2タスク）
8. リジェクト対応・再審査（4タスク）
9. 公開（2タスク）

**合計: 26タスク**

詳細は `default_tasks_template.py` を参照

---

## 実装の優先順位

### Phase 1A: バックエンド実装
1. ✅ デフォルトタスクテンプレートの作成（完了）
2. データモデルの更新（Project, Task）
3. API エンドポイントの実装
   - プロジェクト作成時のデフォルトタスク自動生成
   - タスク完了状態更新
   - タスクメモ更新
   - スケジュール更新
   - フェーズ一覧取得
   - プロジェクトタスク一覧（フェーズ別）

### Phase 1B: フロントエンド実装
1. Dashboard のスケジュール入力フィールド追加
2. ProjectDetail のタスクタブ拡張
   - フェーズごとのアコーディオン表示
   - タスクチェックボックス
   - メモ入力欄
3. スケジュールタブの新規作成
4. UIコンポーネントの統合とスタイリング

### Phase 1C: テストと仕上げ
1. バックエンドAPIテスト
2. フロントエンドE2Eテスト
3. ユーザビリティの確認

---

## 次のステップ

フェーズ1の設計が完了しました。次は実装フェーズに進みます：

1. **バックエンド実装** (Phase 1A)
2. **フロントエンド実装** (Phase 1B)
3. **テストと統合** (Phase 1C)

各実装フェーズは個別にテストし、段階的に機能を追加していきます。
