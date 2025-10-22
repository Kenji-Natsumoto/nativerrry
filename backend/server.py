from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
from default_tasks_template import get_default_tasks_for_platform, get_phases_summary


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ========== Data Models ==========

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    platform: str  # "iOS", "Android", "Both"
    description: Optional[str] = None
    status: str = "active"  # "active", "submitted", "approved", "rejected"
    start_date: Optional[datetime] = None  # ネイティブ申請開始日
    publish_date: Optional[datetime] = None  # 公開日（目標）
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    platform: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    publish_date: Optional[datetime] = None
    auto_generate_tasks: bool = True

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    publish_date: Optional[datetime] = None


class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    description: Optional[str] = None
    phase: str  # フェーズ名（例: "アカウント登録"）
    status: str = "pending"  # "pending", "in_progress", "completed"
    due_date: Optional[datetime] = None
    priority: str = "medium"  # "low", "medium", "high"
    completed: bool = False  # 完了フラグ
    memo: Optional[str] = None  # メモ/ノート
    step_number: Optional[str] = None  # ステップ番号（例: "1.1", "2.3"）
    phase_number: Optional[int] = None  # フェーズ番号（1-9）
    estimated_days: Optional[str] = None  # 所要日数（例: "1-3日", "即時"）
    assigned_to: Optional[str] = None  # 担当者（例: "開発者", "Apple/Google"）
    platform_specific: Optional[str] = None  # プラットフォーム固有情報
    order: int = 0  # フェーズ内での表示順序
    is_default: bool = False  # デフォルトタスクかどうか
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    phase: str
    due_date: Optional[datetime] = None
    priority: str = "medium"
    step_number: Optional[str] = None
    phase_number: Optional[int] = None
    estimated_days: Optional[str] = None
    assigned_to: Optional[str] = None
    platform_specific: Optional[str] = None
    order: int = 0
    is_default: bool = False

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    phase: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    completed: Optional[bool] = None
    memo: Optional[str] = None


class ChecklistItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    platform: str  # "iOS", "Android"
    category: str  # "app_icons", "screenshots", "description", "metadata", "legal"
    item_name: str
    description: Optional[str] = None
    status: str = "incomplete"  # "incomplete", "in_progress", "completed"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChecklistItemCreate(BaseModel):
    project_id: str
    platform: str
    category: str
    item_name: str
    description: Optional[str] = None

class ChecklistItemUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class Rejection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    platform: str  # "iOS", "Android"
    rejection_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: str
    ai_analysis: Optional[str] = None
    action_plan: Optional[str] = None
    status: str = "open"  # "open", "in_progress", "resolved"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RejectionCreate(BaseModel):
    project_id: str
    platform: str
    reason: str

class RejectionUpdate(BaseModel):
    status: Optional[str] = None
    action_plan: Optional[str] = None


class AIMessageRequest(BaseModel):
    project_id: str
    message: str

class AIAnalysisRequest(BaseModel):
    rejection_reason: str
    platform: str


# ========== Helper Functions ==========

def serialize_datetime(doc):
    """Convert datetime objects to ISO strings for MongoDB"""
    if isinstance(doc, dict):
        for key, value in doc.items():
            if isinstance(value, datetime):
                doc[key] = value.isoformat()
    return doc

def deserialize_datetime(doc, fields):
    """Convert ISO strings back to datetime objects"""
    if isinstance(doc, dict):
        for field in fields:
            if field in doc and isinstance(doc[field], str):
                doc[field] = datetime.fromisoformat(doc[field])
    return doc

async def get_ai_response(message: str, system_message: str = "You are a helpful assistant for app store submission.") -> str:
    """Get AI response using Emergent LLM Key"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logger.error(f"AI response error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

async def generate_default_tasks_for_project(project_id: str, platform: str) -> int:
    """プロジェクトにデフォルトタスクを生成する"""
    default_tasks = get_default_tasks_for_platform(platform)
    tasks_created = 0
    
    for task_template in default_tasks:
        task_obj = Task(
            project_id=project_id,
            title=task_template["title"],
            description=task_template["description"],
            phase=task_template["phase"],
            step_number=task_template["step_number"],
            phase_number=task_template["phase_number"],
            estimated_days=task_template["estimated_days"],
            assigned_to=task_template["assigned_to"],
            platform_specific=task_template.get("platform_specific", ""),
            priority=task_template["priority"],
            order=task_template["order"],
            is_default=True,
            status="pending",
            completed=False
        )
        
        doc = task_obj.model_dump()
        doc = serialize_datetime(doc)
        await db.tasks.insert_one(doc)
        tasks_created += 1
    
    return tasks_created


# ========== Project Endpoints ==========

@api_router.get("/")
async def root():
    return {"message": "App Native Submission Support API"}

@api_router.post("/projects", response_model=Project)
async def create_project(input: ProjectCreate):
    auto_generate_tasks = input.auto_generate_tasks
    project_dict = input.model_dump(exclude={'auto_generate_tasks'})
    project_obj = Project(**project_dict)
    
    doc = project_obj.model_dump()
    doc = serialize_datetime(doc)
    
    await db.projects.insert_one(doc)
    
    # デフォルトタスクの自動生成
    if auto_generate_tasks:
        await generate_default_tasks_for_project(project_obj.id, project_obj.platform)
    
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    
    for project in projects:
        deserialize_datetime(project, ['created_at', 'updated_at'])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    deserialize_datetime(project, ['created_at', 'updated_at'])
    return project

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, input: ProjectUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    deserialize_datetime(project, ['created_at', 'updated_at'])
    return project

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Also delete related data
    await db.tasks.delete_many({"project_id": project_id})
    await db.checklist_items.delete_many({"project_id": project_id})
    await db.rejections.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted successfully"}


# ========== Task Endpoints ==========

@api_router.post("/tasks", response_model=Task)
async def create_task(input: TaskCreate):
    task_dict = input.model_dump()
    task_obj = Task(**task_dict)
    
    doc = task_obj.model_dump()
    doc = serialize_datetime(doc)
    
    await db.tasks.insert_one(doc)
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    
    for task in tasks:
        deserialize_datetime(task, ['created_at', 'due_date', 'completed_at'])
    
    return tasks

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, input: TaskUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    # If status is completed, set completed_at
    if update_data.get('status') == 'completed':
        update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    
    # Serialize datetime fields
    if 'due_date' in update_data and update_data['due_date']:
        update_data['due_date'] = update_data['due_date'].isoformat()
    
    result = await db.tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    deserialize_datetime(task, ['created_at', 'due_date', 'completed_at'])
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}


# ========== Checklist Endpoints ==========

@api_router.post("/checklist", response_model=ChecklistItem)
async def create_checklist_item(input: ChecklistItemCreate):
    item_dict = input.model_dump()
    item_obj = ChecklistItem(**item_dict)
    
    doc = item_obj.model_dump()
    doc = serialize_datetime(doc)
    
    await db.checklist_items.insert_one(doc)
    return item_obj

@api_router.get("/checklist", response_model=List[ChecklistItem])
async def get_checklist_items(project_id: Optional[str] = None, platform: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if platform:
        query["platform"] = platform
    
    items = await db.checklist_items.find(query, {"_id": 0}).to_list(1000)
    
    for item in items:
        deserialize_datetime(item, ['created_at'])
    
    return items

@api_router.put("/checklist/{item_id}", response_model=ChecklistItem)
async def update_checklist_item(item_id: str, input: ChecklistItemUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    result = await db.checklist_items.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    item = await db.checklist_items.find_one({"id": item_id}, {"_id": 0})
    deserialize_datetime(item, ['created_at'])
    return item

@api_router.delete("/checklist/{item_id}")
async def delete_checklist_item(item_id: str):
    result = await db.checklist_items.delete_one({"id": item_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    
    return {"message": "Checklist item deleted successfully"}


# ========== Rejection Endpoints ==========

@api_router.post("/rejections", response_model=Rejection)
async def create_rejection(input: RejectionCreate):
    rejection_dict = input.model_dump()
    rejection_obj = Rejection(**rejection_dict)
    
    # Generate AI analysis automatically
    system_message = """You are an expert in app store submission guidelines for both iOS App Store and Google Play Store. 
    Analyze rejection reasons and provide detailed, actionable insights."""
    
    analysis_prompt = f"""Platform: {rejection_obj.platform}
Rejection Reason: {rejection_obj.reason}

Please provide:
1. Root cause analysis
2. Specific guideline violations
3. Similar common issues
4. Detailed action plan to resolve this rejection

Be specific and actionable."""
    
    try:
        ai_analysis = await get_ai_response(analysis_prompt, system_message)
        rejection_obj.ai_analysis = ai_analysis
        
        # Generate action plan
        action_plan_prompt = f"""Based on this rejection: {rejection_obj.reason}
Create a step-by-step action plan to resolve it. Format as a numbered list."""
        
        action_plan = await get_ai_response(action_plan_prompt, system_message)
        rejection_obj.action_plan = action_plan
    except Exception as e:
        logger.error(f"Failed to generate AI analysis: {str(e)}")
        # Continue without AI analysis
    
    doc = rejection_obj.model_dump()
    doc = serialize_datetime(doc)
    
    await db.rejections.insert_one(doc)
    return rejection_obj

@api_router.get("/rejections", response_model=List[Rejection])
async def get_rejections(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    rejections = await db.rejections.find(query, {"_id": 0}).to_list(1000)
    
    for rejection in rejections:
        deserialize_datetime(rejection, ['created_at', 'rejection_date'])
    
    return rejections

@api_router.put("/rejections/{rejection_id}", response_model=Rejection)
async def update_rejection(rejection_id: str, input: RejectionUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    result = await db.rejections.update_one(
        {"id": rejection_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Rejection not found")
    
    rejection = await db.rejections.find_one({"id": rejection_id}, {"_id": 0})
    deserialize_datetime(rejection, ['created_at', 'rejection_date'])
    return rejection


# ========== AI Assistant Endpoints ==========

@api_router.post("/ai/chat")
async def ai_chat(input: AIMessageRequest):
    """General AI assistant for app submission questions"""
    system_message = """You are a helpful assistant specializing in iOS App Store and Google Play Store submission processes.
    Provide clear, accurate, and actionable advice based on the latest guidelines and best practices.
    If asked about specific requirements, cite relevant guidelines when possible."""
    
    response = await get_ai_response(input.message, system_message)
    
    return {
        "project_id": input.project_id,
        "user_message": input.message,
        "ai_response": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.post("/ai/analyze-rejection")
async def analyze_rejection(input: AIAnalysisRequest):
    """Analyze a rejection reason and provide insights"""
    system_message = """You are an expert in app store submission guidelines for both iOS App Store and Google Play Store.
    Analyze rejection reasons and provide detailed, actionable insights."""
    
    analysis_prompt = f"""Platform: {input.platform}
Rejection Reason: {input.rejection_reason}

Please provide:
1. Root cause analysis
2. Specific guideline violations
3. Similar common issues
4. Detailed action plan to resolve this rejection

Be specific and actionable."""
    
    analysis = await get_ai_response(analysis_prompt, system_message)
    
    return {
        "platform": input.platform,
        "rejection_reason": input.rejection_reason,
        "analysis": analysis,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
