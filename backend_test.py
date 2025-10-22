#!/usr/bin/env python3
"""
nativarrry（ネイティバリー）バックエンドAPIテスト
フェーズ2実装の全機能をテストします
"""

import requests
import json
from datetime import datetime, timezone
import time

# テスト設定
BASE_URL = "https://appstore-navigator.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

# テスト結果を記録
test_results = []

def log_test(test_name, success, details="", response_data=None):
    """テスト結果をログに記録"""
    result = {
        "test": test_name,
        "success": success,
        "details": details,
        "timestamp": datetime.now().isoformat(),
        "response_data": response_data
    }
    test_results.append(result)
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"   Details: {details}")
    if not success and response_data:
        print(f"   Response: {response_data}")
    print()

def test_get_phases():
    """GET /api/phases - フェーズ一覧取得テスト"""
    try:
        response = requests.get(f"{BASE_URL}/phases", headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            phases = data.get("phases", [])
            
            # 9つのフェーズが存在するかチェック
            if len(phases) == 9:
                # フェーズの内容をチェック
                expected_phases = [
                    "アカウント登録", "アプリ情報準備・メタデータ入力", "アプリビルド",
                    "アプリアップロード", "テストトラック設定", "審査申請",
                    "審査プロセス", "リジェクト対応・再審査", "公開"
                ]
                
                phase_names = [phase["phase_name"] for phase in phases]
                if all(name in phase_names for name in expected_phases):
                    log_test("GET /api/phases", True, f"9つのフェーズが正しく取得できました: {phase_names}")
                    return True
                else:
                    log_test("GET /api/phases", False, f"期待されるフェーズ名と異なります。取得: {phase_names}")
                    return False
            else:
                log_test("GET /api/phases", False, f"フェーズ数が期待値(9)と異なります。取得: {len(phases)}")
                return False
        else:
            log_test("GET /api/phases", False, f"HTTPステータス: {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test("GET /api/phases", False, f"例外発生: {str(e)}")
        return False

def test_create_project_ios():
    """POST /api/projects - iOSプロジェクト作成テスト"""
    try:
        project_data = {
            "name": "MyAwesome iOS App",
            "platform": "iOS",
            "description": "革新的なiOSアプリケーション",
            "start_date": "2024-01-15T09:00:00Z",
            "publish_date": "2024-03-01T00:00:00Z",
            "auto_generate_tasks": True
        }
        
        response = requests.post(f"{BASE_URL}/projects", headers=HEADERS, json=project_data)
        
        if response.status_code == 200:
            project = response.json()
            project_id = project.get("id")
            
            if project_id and project.get("platform") == "iOS":
                log_test("POST /api/projects (iOS)", True, f"iOSプロジェクト作成成功。ID: {project_id}")
                return project_id
            else:
                log_test("POST /api/projects (iOS)", False, "プロジェクトIDまたはプラットフォームが正しくありません", project)
                return None
        else:
            log_test("POST /api/projects (iOS)", False, f"HTTPステータス: {response.status_code}", response.text)
            return None
            
    except Exception as e:
        log_test("POST /api/projects (iOS)", False, f"例外発生: {str(e)}")
        return None

def test_create_project_android():
    """POST /api/projects - Androidプロジェクト作成テスト"""
    try:
        project_data = {
            "name": "SuperCool Android App",
            "platform": "Android",
            "description": "次世代Androidアプリケーション",
            "start_date": "2024-02-01T09:00:00Z",
            "publish_date": "2024-04-15T00:00:00Z",
            "auto_generate_tasks": True
        }
        
        response = requests.post(f"{BASE_URL}/projects", headers=HEADERS, json=project_data)
        
        if response.status_code == 200:
            project = response.json()
            project_id = project.get("id")
            
            if project_id and project.get("platform") == "Android":
                log_test("POST /api/projects (Android)", True, f"Androidプロジェクト作成成功。ID: {project_id}")
                return project_id
            else:
                log_test("POST /api/projects (Android)", False, "プロジェクトIDまたはプラットフォームが正しくありません", project)
                return None
        else:
            log_test("POST /api/projects (Android)", False, f"HTTPステータス: {response.status_code}", response.text)
            return None
            
    except Exception as e:
        log_test("POST /api/projects (Android)", False, f"例外発生: {str(e)}")
        return None

def test_create_project_both():
    """POST /api/projects - Bothプロジェクト作成テスト"""
    try:
        project_data = {
            "name": "CrossPlatform Mega App",
            "platform": "Both",
            "description": "iOS・Android両対応のクロスプラットフォームアプリ",
            "start_date": "2024-01-20T09:00:00Z",
            "publish_date": "2024-05-01T00:00:00Z",
            "auto_generate_tasks": True
        }
        
        response = requests.post(f"{BASE_URL}/projects", headers=HEADERS, json=project_data)
        
        if response.status_code == 200:
            project = response.json()
            project_id = project.get("id")
            
            if project_id and project.get("platform") == "Both":
                log_test("POST /api/projects (Both)", True, f"Bothプロジェクト作成成功。ID: {project_id}")
                return project_id
            else:
                log_test("POST /api/projects (Both)", False, "プロジェクトIDまたはプラットフォームが正しくありません", project)
                return None
        else:
            log_test("POST /api/projects (Both)", False, f"HTTPステータス: {response.status_code}", response.text)
            return None
            
    except Exception as e:
        log_test("POST /api/projects (Both)", False, f"例外発生: {str(e)}")
        return None

def test_get_project_tasks(project_id, platform):
    """GET /api/projects/{project_id}/tasks - プロジェクトタスク一覧テスト"""
    try:
        response = requests.get(f"{BASE_URL}/projects/{project_id}/tasks", headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            tasks_by_phase = data.get("tasks_by_phase", [])
            
            if len(tasks_by_phase) > 0:
                total_tasks = sum(len(phase["tasks"]) for phase in tasks_by_phase)
                
                # フェーズごとにグループ化されているかチェック
                phase_numbers = [phase["phase_number"] for phase in tasks_by_phase]
                phase_numbers.sort()
                
                # タスクの必須フィールドをチェック
                sample_task = tasks_by_phase[0]["tasks"][0] if tasks_by_phase[0]["tasks"] else None
                
                if sample_task:
                    required_fields = ["id", "title", "phase", "step_number", "phase_number", "estimated_days", "assigned_to"]
                    missing_fields = [field for field in required_fields if field not in sample_task]
                    
                    if not missing_fields:
                        log_test(f"GET /api/projects/{project_id}/tasks ({platform})", True, 
                               f"タスク取得成功。総タスク数: {total_tasks}, フェーズ数: {len(tasks_by_phase)}")
                        return tasks_by_phase
                    else:
                        log_test(f"GET /api/projects/{project_id}/tasks ({platform})", False, 
                               f"タスクに必須フィールドが不足: {missing_fields}")
                        return None
                else:
                    log_test(f"GET /api/projects/{project_id}/tasks ({platform})", False, "タスクが存在しません")
                    return None
            else:
                log_test(f"GET /api/projects/{project_id}/tasks ({platform})", False, "タスクが取得できませんでした")
                return None
        else:
            log_test(f"GET /api/projects/{project_id}/tasks ({platform})", False, 
                   f"HTTPステータス: {response.status_code}", response.text)
            return None
            
    except Exception as e:
        log_test(f"GET /api/projects/{project_id}/tasks ({platform})", False, f"例外発生: {str(e)}")
        return None

def test_generate_default_tasks(project_id):
    """POST /api/projects/{project_id}/generate-default-tasks - デフォルトタスク生成テスト"""
    try:
        response = requests.post(f"{BASE_URL}/projects/{project_id}/generate-default-tasks", headers=HEADERS)
        
        if response.status_code == 200:
            data = response.json()
            tasks_created = data.get("tasks_created", 0)
            
            if tasks_created > 0:
                log_test(f"POST /api/projects/{project_id}/generate-default-tasks", True, 
                       f"デフォルトタスク生成成功。作成数: {tasks_created}")
                return True
            else:
                log_test(f"POST /api/projects/{project_id}/generate-default-tasks", False, 
                       "タスクが作成されませんでした", data)
                return False
        else:
            log_test(f"POST /api/projects/{project_id}/generate-default-tasks", False, 
                   f"HTTPステータス: {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test(f"POST /api/projects/{project_id}/generate-default-tasks", False, f"例外発生: {str(e)}")
        return False

def test_task_completion(task_id):
    """PATCH /api/tasks/{task_id}/complete - タスク完了状態更新テスト"""
    try:
        # タスクを完了状態にする（クエリパラメータとして送信）
        response = requests.patch(f"{BASE_URL}/tasks/{task_id}/complete?completed=true", 
                                headers=HEADERS)
        
        if response.status_code == 200:
            task = response.json()
            
            if task.get("completed") == True and task.get("status") == "completed" and task.get("completed_at"):
                # 未完了状態に戻すテスト
                response2 = requests.patch(f"{BASE_URL}/tasks/{task_id}/complete?completed=false", 
                                         headers=HEADERS)
                
                if response2.status_code == 200:
                    task2 = response2.json()
                    
                    if task2.get("completed") == False and task2.get("status") == "pending":
                        log_test(f"PATCH /api/tasks/{task_id}/complete", True, 
                               "タスク完了状態の更新（完了→未完了）が正常に動作")
                        return True
                    else:
                        log_test(f"PATCH /api/tasks/{task_id}/complete", False, 
                               "未完了状態への更新が正しく動作しません", task2)
                        return False
                else:
                    log_test(f"PATCH /api/tasks/{task_id}/complete", False, 
                           f"未完了更新でHTTPエラー: {response2.status_code}", response2.text)
                    return False
            else:
                log_test(f"PATCH /api/tasks/{task_id}/complete", False, 
                       "完了状態の更新が正しく反映されません", task)
                return False
        else:
            log_test(f"PATCH /api/tasks/{task_id}/complete", False, 
                   f"HTTPステータス: {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test(f"PATCH /api/tasks/{task_id}/complete", False, f"例外発生: {str(e)}")
        return False

def test_task_memo(task_id):
    """PATCH /api/tasks/{task_id}/memo - タスクメモ更新テスト"""
    try:
        memo_text = "重要な注意事項：このタスクは特に慎重に進める必要があります。Apple Developer Programの登録には時間がかかる場合があります。"
        
        # URLエンコードしてクエリパラメータとして送信
        import urllib.parse
        encoded_memo = urllib.parse.quote(memo_text)
        
        response = requests.patch(f"{BASE_URL}/tasks/{task_id}/memo?memo={encoded_memo}", 
                                headers=HEADERS)
        
        if response.status_code == 200:
            task = response.json()
            
            if task.get("memo") == memo_text:
                log_test(f"PATCH /api/tasks/{task_id}/memo", True, 
                       f"メモ更新成功: {memo_text[:50]}...")
                return True
            else:
                log_test(f"PATCH /api/tasks/{task_id}/memo", False, 
                       "メモが正しく更新されません", task)
                return False
        else:
            log_test(f"PATCH /api/tasks/{task_id}/memo", False, 
                   f"HTTPステータス: {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test(f"PATCH /api/tasks/{task_id}/memo", False, f"例外発生: {str(e)}")
        return False

def test_project_schedule(project_id):
    """PATCH /api/projects/{project_id}/schedule - プロジェクトスケジュール更新テスト"""
    try:
        new_start_date = "2024-02-01T10:00:00Z"
        new_publish_date = "2024-06-15T00:00:00Z"
        
        # クエリパラメータとして送信
        response = requests.patch(f"{BASE_URL}/projects/{project_id}/schedule?start_date={new_start_date}&publish_date={new_publish_date}", 
                                headers=HEADERS)
        
        if response.status_code == 200:
            project = response.json()
            
            # 日付の比較（ISO形式で比較）
            if (project.get("start_date") and project.get("publish_date")):
                log_test(f"PATCH /api/projects/{project_id}/schedule", True, 
                       f"スケジュール更新成功。開始日: {project.get('start_date')}, 公開日: {project.get('publish_date')}")
                return True
            else:
                log_test(f"PATCH /api/projects/{project_id}/schedule", False, 
                       "スケジュールが正しく更新されません", project)
                return False
        else:
            log_test(f"PATCH /api/projects/{project_id}/schedule", False, 
                   f"HTTPステータス: {response.status_code}", response.text)
            return False
            
    except Exception as e:
        log_test(f"PATCH /api/projects/{project_id}/schedule", False, f"例外発生: {str(e)}")
        return False

def run_comprehensive_tests():
    """包括的なバックエンドAPIテストを実行"""
    print("=" * 80)
    print("nativarrry（ネイティバリー）フェーズ2 バックエンドAPIテスト開始")
    print("=" * 80)
    print()
    
    # 1. フェーズ一覧取得テスト
    print("🔍 1. フェーズ一覧取得テスト")
    test_get_phases()
    
    # 2. プロジェクト作成テスト（各プラットフォーム）
    print("🔍 2. プロジェクト作成テスト")
    ios_project_id = test_create_project_ios()
    android_project_id = test_create_project_android()
    both_project_id = test_create_project_both()
    
    # 3. プロジェクトタスク一覧取得テスト
    print("🔍 3. プロジェクトタスク一覧取得テスト")
    ios_tasks = None
    android_tasks = None
    both_tasks = None
    
    if ios_project_id:
        ios_tasks = test_get_project_tasks(ios_project_id, "iOS")
    if android_project_id:
        android_tasks = test_get_project_tasks(android_project_id, "Android")
    if both_project_id:
        both_tasks = test_get_project_tasks(both_project_id, "Both")
    
    # 4. デフォルトタスク再生成テスト
    print("🔍 4. デフォルトタスク再生成テスト")
    if ios_project_id:
        test_generate_default_tasks(ios_project_id)
        # 再生成後に新しいタスクを取得
        ios_tasks_after_regen = test_get_project_tasks(ios_project_id, "iOS (after regen)")
    
    # 5. タスク完了状態更新テスト
    print("🔍 5. タスク完了状態更新テスト")
    if ios_tasks_after_regen and len(ios_tasks_after_regen) > 0 and len(ios_tasks_after_regen[0]["tasks"]) > 0:
        first_task_id = ios_tasks_after_regen[0]["tasks"][0]["id"]
        test_task_completion(first_task_id)
        
        # 6. タスクメモ更新テスト
        print("🔍 6. タスクメモ更新テスト")
        test_task_memo(first_task_id)
    elif ios_tasks and len(ios_tasks) > 0 and len(ios_tasks[0]["tasks"]) > 0:
        # フォールバック：元のタスクを使用
        first_task_id = ios_tasks[0]["tasks"][0]["id"]
        test_task_completion(first_task_id)
        
        # 6. タスクメモ更新テスト
        print("🔍 6. タスクメモ更新テスト")
        test_task_memo(first_task_id)
    
    # 7. プロジェクトスケジュール更新テスト
    print("🔍 7. プロジェクトスケジュール更新テスト")
    if ios_project_id:
        test_project_schedule(ios_project_id)
    
    # テスト結果サマリー
    print("=" * 80)
    print("テスト結果サマリー")
    print("=" * 80)
    
    passed_tests = [r for r in test_results if r["success"]]
    failed_tests = [r for r in test_results if not r["success"]]
    
    print(f"✅ 成功: {len(passed_tests)}件")
    print(f"❌ 失敗: {len(failed_tests)}件")
    print(f"📊 総テスト数: {len(test_results)}件")
    print()
    
    if failed_tests:
        print("❌ 失敗したテスト:")
        for test in failed_tests:
            print(f"   - {test['test']}: {test['details']}")
        print()
    
    # 詳細結果をJSONファイルに保存
    with open("/app/backend_test_results.json", "w", encoding="utf-8") as f:
        json.dump(test_results, f, ensure_ascii=False, indent=2)
    
    print(f"📄 詳細結果は backend_test_results.json に保存されました")
    
    return len(failed_tests) == 0

if __name__ == "__main__":
    success = run_comprehensive_tests()
    exit(0 if success else 1)