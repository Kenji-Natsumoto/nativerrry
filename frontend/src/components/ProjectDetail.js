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
  Loader2
} from 'lucide-react';

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
    { id: 'checklist', label: 'チェックリスト', icon: CheckSquare },
    { id: 'rejections', label: 'リジェクト対応', icon: AlertTriangle },
    { id: 'ai', label: 'AIアシスタント', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" data-testid="project-name">
                  {project.name}
                </h1>
                <p className="text-sm text-gray-500">{project.platform}</p>
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
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
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
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6" data-testid="overview-tab">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">プロジェクト概要</h2>
              <p className="text-gray-600 mb-4">{project.description || 'プロジェクトの説明はありません'}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
                
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-red-600 font-medium mb-1">リジェクト</div>
                  <div className="text-2xl font-bold text-red-900">{rejections.length}</div>
                  <div className="text-xs text-red-600 mt-1">
                    {rejections.filter(r => r.status === 'open').length} 件対応中
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6" data-testid="schedule-tab">
            <div className="bg-white rounded-lg shadow-sm border p-6">
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
            <div className="bg-white rounded-lg shadow-sm border p-6">
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
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <ListTodo className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">タスクがありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  デフォルトタスクを生成してください
                </p>
              </div>
            ) : (
              tasksByPhase.map((phase) => (
                <div key={phase.phase_number} className="bg-white rounded-lg shadow-sm border">
                  <div className="bg-gray-50 px-6 py-4 border-b">
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

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-6" data-testid="checklist-tab">
            {(project.platform === 'Both' ? ['iOS', 'Android'] : [project.platform]).map((platform) => (
              <div key={platform} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{platform} チェックリスト</h3>
                  <button
                    onClick={() => addChecklistItem(platform)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    data-testid={`add-checklist-${platform}`}
                  >
                    <Plus className="w-4 h-4" />
                    項目追加
                  </button>
                </div>
                
                {checklistItems.filter(item => item.platform === platform).length === 0 ? (
                  <p className="text-gray-400 text-sm">チェックリスト項目がありません</p>
                ) : (
                  <div className="space-y-2">
                    {checklistItems.filter(item => item.platform === platform).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50"
                        data-testid={`checklist-item-${item.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={item.status === 'completed'}
                          onChange={(e) => updateChecklistStatus(item.id, e.target.checked ? 'completed' : 'incomplete')}
                          className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                          data-testid={`checklist-checkbox-${item.id}`}
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {item.item_name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">リジェクト履歴がありません</h3>
                <p className="mt-1 text-sm text-gray-500">
                  リジェクトされた場合、ここに記録して対応を管理できます
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rejections.map((rejection) => (
                  <div key={rejection.id} className="bg-white rounded-lg shadow-sm border p-6" data-testid={`rejection-${rejection.id}`}>
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
          <div className="bg-white rounded-lg shadow-sm border p-6" data-testid="ai-tab">
            <h2 className="text-xl font-semibold mb-4">AIアシスタント</h2>
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
    </div>
  );
};

export default ProjectDetail;
