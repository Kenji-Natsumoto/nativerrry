import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  ListTodo, 
  CheckSquare, 
  AlertTriangle, 
  MessageSquare,
  LayoutDashboard,
  Plus,
  Trash2,
  Clock,
  Calendar,
  Send,
  Loader2,
  BarChart3,
  TrendingUp,
  Target,
  Upload,
  File as FileIcon,
  Image as ImageIcon,
  X
} from 'lucide-react';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksByPhase, setTasksByPhase] = useState([]);
  const [phases, setPhases] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [rejections, setRejections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Chat state
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  
  // Schedule state
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    start_date: '',
    publish_date: ''
  });

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const [projectRes, tasksByPhaseRes, phasesRes, checklistRes, rejectionsRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}`),
        axios.get(`${API}/projects/${projectId}/tasks`),
        axios.get(`${API}/phases`),
        axios.get(`${API}/checklist?project_id=${projectId}`),
        axios.get(`${API}/rejections?project_id=${projectId}`)
      ]);
      
      setProject(projectRes.data);
      setTasksByPhase(tasksByPhaseRes.data.tasks_by_phase || []);
      setPhases(phasesRes.data.phases || []);
      setChecklistItems(checklistRes.data);
      setRejections(rejectionsRes.data);
      
      // Initialize schedule data
      setScheduleData({
        start_date: projectRes.data.start_date ? projectRes.data.start_date.split('T')[0] : '',
        publish_date: projectRes.data.publish_date ? projectRes.data.publish_date.split('T')[0] : ''
      });
    } catch (error) {
      console.error('Failed to load project data:', error);
      alert('プロジェクトの読み込みに失敗しました');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAIChat = async (e) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    setAiLoading(true);
    try {
      const response = await axios.post(`${API}/ai/chat`, {
        project_id: projectId,
        message: aiMessage
      });
      setAiResponse(response.data);
      setAiMessage('');
    } catch (error) {
      console.error('AI chat error:', error);
      alert('AI応答の取得に失敗しました');
    } finally {
      setAiLoading(false);
    }
  };

  const addNewTask = async (phase) => {
    const title = prompt('タスク名を入力してください:');
    if (!title) return;

    try {
      const response = await axios.post(`${API}/tasks`, {
        project_id: projectId,
        title,
        phase,
        status: 'pending',
        priority: 'medium'
      });
      setTasks([...tasks, response.data]);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('タスクの作成に失敗しました');
    }
  };

  const toggleTaskCompletion = async (taskId, completed) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}/complete?completed=${completed}`);
      // Reload tasks to reflect changes
      const tasksByPhaseRes = await axios.get(`${API}/projects/${projectId}/tasks`);
      setTasksByPhase(tasksByPhaseRes.data.tasks_by_phase || []);
    } catch (error) {
      console.error('Failed to update task completion:', error);
      alert('タスクの更新に失敗しました');
    }
  };

  const updateTaskMemo = async (taskId, memo) => {
    try {
      await axios.patch(`${API}/tasks/${taskId}/memo?memo=${encodeURIComponent(memo)}`);
      // Reload tasks to reflect changes
      const tasksByPhaseRes = await axios.get(`${API}/projects/${projectId}/tasks`);
      setTasksByPhase(tasksByPhaseRes.data.tasks_by_phase || []);
    } catch (error) {
      console.error('Failed to update task memo:', error);
      alert('メモの更新に失敗しました');
    }
  };

  const updateTaskDueDate = async (taskId, dueDate) => {
    try {
      await axios.put(`${API}/tasks/${taskId}`, {
        due_date: dueDate ? new Date(dueDate).toISOString() : null
      });
      // Reload tasks to reflect changes
      const tasksByPhaseRes = await axios.get(`${API}/projects/${projectId}/tasks`);
      setTasksByPhase(tasksByPhaseRes.data.tasks_by_phase || []);
    } catch (error) {
      console.error('Failed to update task due date:', error);
      alert('期日の更新に失敗しました');
    }
  };

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { type: 'overdue', label: '期日超過', color: 'bg-red-100 text-red-700' };
    } else if (diffDays === 0) {
      return { type: 'today', label: '今日が期日', color: 'bg-orange-100 text-orange-700' };
    } else if (diffDays <= 3) {
      return { type: 'soon', label: `残り${diffDays}日`, color: 'bg-yellow-100 text-yellow-700' };
    } else if (diffDays <= 7) {
      return { type: 'week', label: `残り${diffDays}日`, color: 'bg-blue-100 text-blue-700' };
    }
    return null;
  };

  const handleMemoChange = (taskId, memo) => {
    // Update locally first for instant feedback
    setTasksByPhase(tasksByPhase.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => 
        task.id === taskId ? { ...task, memo } : task
      )
    })));
  };

  const updateSchedule = async () => {
    try {
      const params = new URLSearchParams();
      if (scheduleData.start_date) {
        params.append('start_date', new Date(scheduleData.start_date).toISOString());
      }
      if (scheduleData.publish_date) {
        params.append('publish_date', new Date(scheduleData.publish_date).toISOString());
      }
      
      await axios.patch(`${API}/projects/${projectId}/schedule?${params.toString()}`);
      setEditingSchedule(false);
      // Reload project data
      const projectRes = await axios.get(`${API}/projects/${projectId}`);
      setProject(projectRes.data);
      alert('スケジュールを更新しました');
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert('スケジュールの更新に失敗しました');
    }
  };

  const updateProjectStatus = async (newStatus) => {
    try {
      await axios.put(`${API}/projects/${projectId}`, {
        status: newStatus
      });
      // Reload project data
      const projectRes = await axios.get(`${API}/projects/${projectId}`);
      setProject(projectRes.data);
    } catch (error) {
      console.error('Failed to update project status:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      active: { 
        label: '進行中', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🔵'
      },
      submitted: { 
        label: '審査中', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳'
      },
      approved: { 
        label: '承認済み', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      },
      rejected: { 
        label: 'リジェクト', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '❌'
      }
    };
    return statusMap[status] || statusMap.active;
  };

  const generateDefaultTasks = async () => {
    if (!window.confirm('デフォルトタスクを生成しますか？既存のデフォルトタスクは削除されます。')) return;
    
    try {
      await axios.post(`${API}/projects/${projectId}/generate-default-tasks`);
      // Reload tasks
      const tasksByPhaseRes = await axios.get(`${API}/projects/${projectId}/tasks`);
      setTasksByPhase(tasksByPhaseRes.data.tasks_by_phase || []);
      alert('デフォルトタスクを生成しました');
    } catch (error) {
      console.error('Failed to generate default tasks:', error);
      alert('デフォルトタスクの生成に失敗しました');
    }
  };

  const generateDefaultChecklist = async () => {
    if (!window.confirm('デフォルトチェックリストを生成しますか？既存のデフォルトチェックリストは削除されます。')) return;
    
    try {
      await axios.post(`${API}/projects/${projectId}/generate-default-checklist`);
      // Reload checklist
      const checklistRes = await axios.get(`${API}/checklist?project_id=${projectId}`);
      setChecklistItems(checklistRes.data);
      alert('デフォルトチェックリストを生成しました');
    } catch (error) {
      console.error('Failed to generate default checklist:', error);
      alert('デフォルトチェックリストの生成に失敗しました');
    }
  };

  const updateChecklistItem = async (itemId, updates) => {
    try {
      await axios.put(`${API}/checklist/${itemId}`, updates);
      // Reload checklist
      const checklistRes = await axios.get(`${API}/checklist?project_id=${projectId}`);
      setChecklistItems(checklistRes.data);
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      alert('チェックリスト項目の更新に失敗しました');
    }
  };

  const uploadFileToChecklist = async (itemId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/checklist/${itemId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Upload response:', response.data);
      
      // Reload checklist immediately after upload
      await loadProjectData();
      
      alert('ファイルをアップロードしました');
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('ファイルのアップロードに失敗しました: ' + (error.response?.data?.detail || error.message));
    }
  };

  const deleteFileFromChecklist = async (itemId, filename) => {
    if (!window.confirm('このファイルを削除しますか？')) return;
    
    try {
      await axios.delete(`${API}/checklist/${itemId}/files/${filename}`);
      // Reload checklist
      const checklistRes = await axios.get(`${API}/checklist?project_id=${projectId}`);
      setChecklistItems(checklistRes.data);
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('ファイルの削除に失敗しました');
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return ImageIcon;
    return FileIcon;
  };

  const isImageFile = (mimeType) => {
    return mimeType.startsWith('image/');
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('このタスクを削除しますか？')) return;

    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const addChecklistItem = async (platform) => {
    const item_name = prompt('チェックリスト項目名を入力してください:');
    if (!item_name) return;

    try {
      const response = await axios.post(`${API}/checklist`, {
        project_id: projectId,
        platform,
        category: 'general',
        item_name
      });
      setChecklistItems([...checklistItems, response.data]);
    } catch (error) {
      console.error('Failed to create checklist item:', error);
      alert('チェックリスト項目の作成に失敗しました');
    }
  };

  const updateChecklistStatus = async (itemId, newStatus) => {
    try {
      const response = await axios.put(`${API}/checklist/${itemId}`, {
        status: newStatus
      });
      setChecklistItems(checklistItems.map(item => item.id === itemId ? response.data : item));
    } catch (error) {
      console.error('Failed to update checklist item:', error);
    }
  };

  const addRejection = async () => {
    const platform = prompt('プラットフォームを入力 (iOS または Android):');
    if (!platform) return;
    
    const reason = prompt('リジェクト理由を入力してください:');
    if (!reason) return;

    try {
      const response = await axios.post(`${API}/rejections`, {
        project_id: projectId,
        platform,
        reason
      });
      setRejections([...rejections, response.data]);
    } catch (error) {
      console.error('Failed to create rejection:', error);
      alert('リジェクト情報の作成に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // Calculate statistics
  const allTasks = tasksByPhase.flatMap(phase => phase.tasks || []);
  const completedTasks = allTasks.filter(t => t.completed).length;
  const totalTasks = allTasks.length;
  const completedChecklist = checklistItems.filter(i => i.status === 'completed').length;
  const totalChecklist = checklistItems.length;
  
  // Due date statistics
  const overdueTasks = allTasks.filter(t => {
    if (!t.due_date || t.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;
  
  const upcomingTasks = allTasks.filter(t => {
    if (!t.due_date || t.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const tabs = [
    { id: 'overview', label: '概要', icon: LayoutDashboard },
    { id: 'schedule', label: 'スケジュール', icon: Calendar },
    { id: 'tasks', label: 'タスク', icon: ListTodo },
    { id: 'report', label: 'レポート', icon: BarChart3 },
    { id: 'checklist', label: 'チェックリスト', icon: CheckSquare },
    { id: 'rejections', label: 'リジェクト対応', icon: AlertTriangle },
    { id: 'ai', label: 'AIアシスタント', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent" data-testid="project-name">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{project.platform}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {/* Status Dropdown */}
              <div className="relative">
                <select
                  value={project.status}
                  onChange={(e) => updateProjectStatus(e.target.value)}
                  className={`px-4 py-2 pr-10 text-sm font-medium rounded-lg border ${getStatusInfo(project.status).color} focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none`}
                  data-testid="status-select"
                >
                  <option value="active">🔵 進行中</option>
                  <option value="submitted">⏳ 審査中</option>
                  <option value="approved">✅ 承認済み</option>
                  <option value="rejected">❌ リジェクト</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              
              <button
                onClick={async () => {
                  if (window.confirm(`「${project.name}」を削除しますか？\nこの操作は取り消せません。`)) {
                    try {
                      await axios.delete(`${API}/projects/${projectId}`);
                      alert('プロジェクトを削除しました');
                      navigate('/');
                    } catch (error) {
                      console.error('Failed to delete project:', error);
                      alert('プロジェクトの削除に失敗しました');
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                data-testid="delete-project-button"
              >
                <Trash2 className="w-4 h-4" />
                プロジェクトを削除
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-6" data-testid="tab-navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6" data-testid="overview-tab">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">プロジェクト概要</h2>
                  <p className="text-gray-600">{project.description || 'プロジェクトの説明はありません'}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border ${getStatusInfo(project.status).color}`}>
                    <span>{getStatusInfo(project.status).icon}</span>
                    {getStatusInfo(project.status).label}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium mb-1">タスク進捗</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : '0/0'}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}%` : '0%'}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium mb-1">チェックリスト</div>
                  <div className="text-2xl font-bold text-green-900">
                    {totalChecklist > 0 ? `${completedChecklist}/${totalChecklist}` : '0/0'}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {totalChecklist > 0 ? `${Math.round((completedChecklist / totalChecklist) * 100)}%` : '0%'}
                  </div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-orange-600 font-medium mb-1">期日超過</div>
                  <div className="text-2xl font-bold text-orange-900">{overdueTasks}</div>
                  <div className="text-xs text-orange-600 mt-1">
                    要対応タスク
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 font-medium mb-1">今週の期日</div>
                  <div className="text-2xl font-bold text-yellow-900">{upcomingTasks}</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    7日以内
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6" data-testid="schedule-tab">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">プロジェクトスケジュール</h2>
                {!editingSchedule ? (
                  <button
                    onClick={() => setEditingSchedule(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    編集
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingSchedule(false);
                        setScheduleData({
                          start_date: project.start_date ? project.start_date.split('T')[0] : '',
                          publish_date: project.publish_date ? project.publish_date.split('T')[0] : ''
                        });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={updateSchedule}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                      保存
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    ネイティブ申請開始日
                  </label>
                  {editingSchedule ? (
                    <input
                      type="date"
                      value={scheduleData.start_date}
                      onChange={(e) => setScheduleData({ ...scheduleData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-blue-900">
                      {project.start_date 
                        ? new Date(project.start_date).toLocaleDateString('ja-JP') 
                        : '未設定'}
                    </div>
                  )}
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <label className="block text-sm font-medium text-green-900 mb-2">
                    公開日（目標）
                  </label>
                  {editingSchedule ? (
                    <input
                      type="date"
                      value={scheduleData.publish_date}
                      onChange={(e) => setScheduleData({ ...scheduleData, publish_date: e.target.value })}
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-green-900">
                      {project.publish_date 
                        ? new Date(project.publish_date).toLocaleDateString('ja-JP') 
                        : '未設定'}
                    </div>
                  )}
                </div>
              </div>

              {project.start_date && project.publish_date && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">予定期間</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.ceil((new Date(project.publish_date) - new Date(project.start_date)) / (1000 * 60 * 60 * 24))} 日間
                  </div>
                </div>
              )}
            </div>

            {/* Phase Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">フェーズ別進捗</h3>
              <div className="space-y-4">
                {tasksByPhase.map((phase) => {
                  const phaseCompletedTasks = phase.tasks.filter(t => t.completed).length;
                  const phaseTotalTasks = phase.tasks.length;
                  const progress = phaseTotalTasks > 0 ? Math.round((phaseCompletedTasks / phaseTotalTasks) * 100) : 0;
                  
                  return (
                    <div key={phase.phase_number} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{phase.phase_name}</div>
                        <div className="text-sm text-gray-600">
                          {phaseCompletedTasks}/{phaseTotalTasks} 完了
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Due Dates */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">期日が設定されたタスク</h3>
              <div className="space-y-3">
                {allTasks
                  .filter(t => t.due_date && !t.completed)
                  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                  .map((task) => {
                    const status = getDueDateStatus(task.due_date);
                    return (
                      <div key={task.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {task.step_number && (
                                <span className="text-blue-600 mr-2">[{task.step_number}]</span>
                              )}
                              {task.title}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {task.phase}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(task.due_date).toLocaleDateString('ja-JP')}
                            </div>
                            {status && (
                              <span className={`mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                                {status.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {allTasks.filter(t => t.due_date && !t.completed).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-4">
                    期日が設定されたタスクはありません
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6" data-testid="tasks-tab">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">タスク管理</h2>
              <button
                onClick={generateDefaultTasks}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                デフォルトタスク生成
              </button>
            </div>

            {tasksByPhase.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <ListTodo className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">タスクがありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  デフォルトタスクを生成してください
                </p>
              </div>
            ) : (
              tasksByPhase.map((phase) => (
                <div key={phase.phase_number} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          フェーズ {phase.phase_number}: {phase.phase_name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {phase.tasks.filter(t => t.completed).length}/{phase.tasks.length} 完了
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-3">
                    {phase.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        data-testid={`task-${task.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => toggleTaskCompletion(task.id, e.target.checked)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            data-testid={`task-checkbox-${task.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                  {task.step_number && (
                                    <span className="text-blue-600 mr-2">[{task.step_number}]</span>
                                  )}
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  {task.estimated_days && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.estimated_days}
                                    </span>
                                  )}
                                  {task.assigned_to && (
                                    <span>担当: {task.assigned_to}</span>
                                  )}
                                  {task.priority && (
                                    <span className={`px-2 py-0.5 rounded-full ${
                                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                                    </span>
                                  )}
                                </div>
                                {task.platform_specific && (
                                  <div className="mt-2 bg-blue-50 rounded p-2 text-xs text-blue-800">
                                    📱 {task.platform_specific}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Due Date Section */}
                            <div className="mt-3 flex items-center gap-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">期日</label>
                                <input
                                  type="date"
                                  value={task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''}
                                  onChange={(e) => updateTaskDueDate(task.id, e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  data-testid={`task-due-date-${task.id}`}
                                />
                              </div>
                              {task.due_date && getDueDateStatus(task.due_date) && (
                                <div className="pt-5">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDueDateStatus(task.due_date).color}`}>
                                    {getDueDateStatus(task.due_date).label}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Memo Section */}
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                              <textarea
                                value={task.memo || ''}
                                onChange={(e) => handleMemoChange(task.id, e.target.value)}
                                onBlur={(e) => updateTaskMemo(task.id, e.target.value)}
                                rows="2"
                                placeholder="タスクに関するメモを入力..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                data-testid={`task-memo-${task.id}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="space-y-6" data-testid="report-tab">
            {/* Overall Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                全体進捗サマリー
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Task Progress Circle */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className="text-blue-600"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - (totalTasks > 0 ? completedTasks / totalTasks : 0))}`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold text-gray-900">
                      {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-medium text-gray-700">タスク完了率</div>
                  <div className="text-xs text-gray-500">{completedTasks}/{totalTasks} 完了</div>
                </div>

                {/* Checklist Progress Circle */}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className="text-green-600"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - (totalChecklist > 0 ? completedChecklist / totalChecklist : 0))}`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold text-gray-900">
                      {totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0}%
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-medium text-gray-700">チェックリスト完了率</div>
                  <div className="text-xs text-gray-500">{completedChecklist}/{totalChecklist} 完了</div>
                </div>

                {/* Stats Summary */}
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium">総タスク数</div>
                    <div className="text-3xl font-bold text-blue-900">{totalTasks}</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-orange-600 font-medium">期日超過</div>
                    <div className="text-3xl font-bold text-orange-900">{overdueTasks}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600 font-medium">リジェクト</div>
                    <div className="text-3xl font-bold text-red-900">{rejections.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                フェーズ別分析
              </h2>
              
              <div className="space-y-4">
                {tasksByPhase.map((phase) => {
                  const phaseCompletedTasks = phase.tasks.filter(t => t.completed).length;
                  const phaseTotalTasks = phase.tasks.length;
                  const progress = phaseTotalTasks > 0 ? Math.round((phaseCompletedTasks / phaseTotalTasks) * 100) : 0;
                  const overdueInPhase = phase.tasks.filter(t => {
                    if (!t.due_date || t.completed) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const due = new Date(t.due_date);
                    due.setHours(0, 0, 0, 0);
                    return due < today;
                  }).length;
                  
                  return (
                    <div key={phase.phase_number} className="border rounded-lg p-5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">
                            フェーズ {phase.phase_number}: {phase.phase_name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {phaseCompletedTasks}/{phaseTotalTasks} 完了
                            {overdueInPhase > 0 && (
                              <span className="ml-3 text-orange-600">⚠ 期日超過: {overdueInPhase}件</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{progress}%</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-300 ${
                            progress === 100 ? 'bg-green-500' : 
                            progress >= 50 ? 'bg-blue-500' : 
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">未完了:</span>
                          <span className="ml-2 font-medium text-gray-900">{phaseTotalTasks - phaseCompletedTasks}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">進行中:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {phase.tasks.filter(t => !t.completed && t.due_date).length}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">完了:</span>
                          <span className="ml-2 font-medium text-green-600">{phaseCompletedTasks}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rejection Analysis */}
            {rejections.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  リジェクト分析
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Platform breakdown */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">プラットフォーム別</h3>
                    <div className="space-y-3">
                      {['iOS', 'Android'].map(platform => {
                        const count = rejections.filter(r => r.platform === platform).length;
                        const percentage = rejections.length > 0 ? Math.round((count / rejections.length) * 100) : 0;
                        return (
                          <div key={platform}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">{platform}</span>
                              <span className="text-sm font-medium text-gray-900">{count}件 ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status breakdown */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">対応状況</h3>
                    <div className="space-y-3">
                      {[
                        { status: 'open', label: '対応中' },
                        { status: 'in_progress', label: '進行中' },
                        { status: 'resolved', label: '解決済み' }
                      ].map(({ status, label }) => {
                        const count = rejections.filter(r => r.status === status).length;
                        const percentage = rejections.length > 0 ? Math.round((count / rejections.length) * 100) : 0;
                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">{label}</span>
                              <span className="text-sm font-medium text-gray-900">{count}件 ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  status === 'resolved' ? 'bg-green-500' :
                                  status === 'in_progress' ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-6" data-testid="checklist-tab">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">申請チェックリスト</h2>
              <button
                onClick={generateDefaultChecklist}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                デフォルトチェックリスト生成
              </button>
            </div>

            {checklistItems.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">チェックリスト項目がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  デフォルトチェックリストを生成してください
                </p>
              </div>
            ) : (
              (project.platform === 'Both' ? ['iOS', 'Android'] : [project.platform]).map((platform) => {
                const platformItems = checklistItems
                  .filter(item => item.platform === platform)
                  .sort((a, b) => (a.order || 0) - (b.order || 0));
                
                if (platformItems.length === 0) return null;
                
                const completedCount = platformItems.filter(item => item.status === 'completed').length;
                const progress = Math.round((completedCount / platformItems.length) * 100);

                return (
                  <div key={platform} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{platform} ストア申請チェックリスト</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {completedCount}/{platformItems.length} 完了 ({progress}%)
                          </p>
                        </div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {platformItems.map((item) => (
                        <div
                          key={item.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`checklist-item-${item.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={item.status === 'completed'}
                              onChange={(e) => updateChecklistItem(item.id, { 
                                status: e.target.checked ? 'completed' : 'incomplete' 
                              })}
                              className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                              data-testid={`checklist-checkbox-${item.id}`}
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {item.item_name}
                              </div>
                              {item.description && (
                                <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                              )}
                              
                              {/* Value Input */}
                              <div className="mt-3">
                                <input
                                  type="text"
                                  value={item.value || ''}
                                  onChange={(e) => {
                                    // Update locally first
                                    setChecklistItems(checklistItems.map(ci => 
                                      ci.id === item.id ? { ...ci, value: e.target.value } : ci
                                    ));
                                  }}
                                  onBlur={(e) => updateChecklistItem(item.id, { value: e.target.value })}
                                  placeholder="記入内容を入力..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  data-testid={`checklist-value-${item.id}`}
                                />
                              </div>

                              {/* File Upload */}
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">ファイル添付</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                                  <input
                                    type="file"
                                    id={`file-upload-${item.id}`}
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) uploadFileToChecklist(item.id, file);
                                      e.target.value = '';
                                    }}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx"
                                  />
                                  <label
                                    htmlFor={`file-upload-${item.id}`}
                                    className="flex flex-col items-center cursor-pointer"
                                  >
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600">クリックしてファイルを選択</span>
                                    <span className="text-xs text-gray-400 mt-1">画像、PDF、Word対応</span>
                                  </label>
                                </div>

                                {/* Uploaded Files */}
                                {item.files && item.files.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {item.files.map((file, idx) => {
                                      const fileUrl = `${API}/uploads/${file.filename}`;
                                      const isImage = file.mime_type && file.mime_type.startsWith('image/');
                                      const isPdf = file.mime_type && file.mime_type === 'application/pdf';
                                      const isDoc = file.mime_type && (
                                        file.mime_type === 'application/msword' || 
                                        file.mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                      );
                                      
                                      return (
                                        <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
                                          {/* Thumbnail/Icon */}
                                          <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded flex-shrink-0">
                                            {isImage ? (
                                              <img
                                                src={fileUrl}
                                                alt={file.original_name}
                                                className="w-12 h-12 object-cover rounded"
                                                onError={(e) => {
                                                  console.error('Failed to load image:', fileUrl);
                                                  e.target.src = '';
                                                  e.target.style.display = 'none';
                                                  e.target.parentElement.innerHTML = '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                                }}
                                              />
                                            ) : isPdf ? (
                                              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                              </svg>
                                            ) : isDoc ? (
                                              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                            ) : (
                                              <FileIcon className="w-6 h-6 text-gray-500" />
                                            )}
                                          </div>
                                          
                                          {/* File Info */}
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">
                                              {file.original_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {(file.file_size / 1024).toFixed(1)} KB
                                              {isPdf && ' • PDF'}
                                              {isDoc && ' • Word'}
                                              {isImage && ' • 画像'}
                                            </div>
                                          </div>
                                          
                                          {/* View Button */}
                                          <a
                                            href={fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                                          >
                                            表示
                                          </a>
                                          
                                          {/* Delete Button */}
                                          <button
                                            onClick={() => deleteFileFromChecklist(item.id, file.filename)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            title="削除"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Notes */}
                              {item.notes && (
                                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">
                                  📝 {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Rejections Tab */}
        {activeTab === 'rejections' && (
          <div className="space-y-6" data-testid="rejections-tab">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">リジェクト履歴</h2>
              <button
                onClick={addRejection}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                data-testid="add-rejection-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                リジェクト追加
              </button>
            </div>

            {rejections.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">リジェクト履歴がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  リジェクトされた場合、ここに記録して対応を管理できます
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rejections.map((rejection) => (
                  <div key={rejection.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid={`rejection-${rejection.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {rejection.platform}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium status-${rejection.status}`}>
                          {rejection.status === 'open' ? '対応中' : rejection.status === 'in_progress' ? '進行中' : '解決済み'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(rejection.rejection_date).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">リジェクト理由:</h4>
                      <p className="text-sm text-gray-700">{rejection.reason}</p>
                    </div>
                    
                    {rejection.ai_analysis && (
                      <div className="mb-4 bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">AI分析:</h4>
                        <div className="text-sm text-blue-800 whitespace-pre-wrap">{rejection.ai_analysis}</div>
                      </div>
                    )}
                    
                    {rejection.action_plan && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-900 mb-2">対策アクションプラン:</h4>
                        <div className="text-sm text-green-800 whitespace-pre-wrap">{rejection.action_plan}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'ai' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6" data-testid="ai-tab">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">AIアシスタント</h2>
            <p className="text-gray-600 mb-6">
              アプリストア申請に関する質問や、ガイドライン、ベストプラクティスについて聞いてみてください。
            </p>
            
            <form onSubmit={handleAIChat} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="質問を入力してください..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={aiLoading}
                  data-testid="ai-message-input"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  data-testid="ai-send-button"
                >
                  {aiLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  送信
                </button>
              </div>
            </form>
            
            {aiResponse && (
              <div className="bg-gray-50 rounded-lg p-4" data-testid="ai-response">
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-500 mb-1">あなた:</div>
                  <div className="text-gray-900">{aiResponse.user_message}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-600 mb-1">AIアシスタント:</div>
                  <div className="text-gray-900 whitespace-pre-wrap prose max-w-none">
                    {aiResponse.ai_response}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProjectDetail;
