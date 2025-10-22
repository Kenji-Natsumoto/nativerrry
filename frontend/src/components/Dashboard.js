import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, FolderKanban, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    platform: 'Both',
    description: '',
    start_date: '',
    publish_date: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/projects`, newProject);
      setProjects([...projects, response.data]);
      setShowModal(false);
      setNewProject({ name: '', platform: 'Both', description: '', start_date: '', publish_date: '' });
      
      // Navigate to the new project
      navigate(`/project/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('プロジェクトの作成に失敗しました');
    }
  };

  const getPlatformIcon = (platform) => {
    if (platform === 'iOS') return '🍎';
    if (platform === 'Android') return '🤖';
    return '📱';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '進行中', color: 'bg-blue-100 text-blue-800' },
      submitted: { label: '審査中', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '承認済み', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'リジェクト', color: 'bg-red-100 text-red-800' }
    };
    const badge = statusMap[status] || statusMap.active;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    );
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">
                アプリネイティブ化サポート
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                iOS & Android ストア申請をスムーズに
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              data-testid="create-project-button"
            >
              <Plus className="w-5 h-5 mr-2" />
              新規プロジェクト
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12" data-testid="empty-state">
            <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">プロジェクトがありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              新規プロジェクトを作成して始めましょう
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                新規プロジェクト作成
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="projects-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getPlatformIcon(project.platform)}</span>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {project.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {project.description || 'プロジェクトの説明はありません'}
                    </p>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(project.status)}
                      <span className="text-xs text-gray-400">
                        {project.platform}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    作成日: {new Date(project.created_at).toLocaleDateString('ja-JP')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="new-project-modal">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">新規プロジェクト作成</h2>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    プロジェクト名 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: My Awesome App"
                    data-testid="project-name-input"
                  />
                </div>

                <div>
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                    プラットフォーム *
                  </label>
                  <select
                    id="platform"
                    value={newProject.platform}
                    onChange={(e) => setNewProject({ ...newProject, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="platform-select"
                  >
                    <option value="Both">両方 (iOS & Android)</option>
                    <option value="iOS">iOS のみ</option>
                    <option value="Android">Android のみ</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="プロジェクトの簡単な説明を入力してください"
                    data-testid="project-description-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                      ネイティブ申請開始日
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      value={newProject.start_date}
                      onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="project-start-date-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="publish_date" className="block text-sm font-medium text-gray-700 mb-1">
                      公開日（目標）
                    </label>
                    <input
                      type="date"
                      id="publish_date"
                      value={newProject.publish_date}
                      onChange={(e) => setNewProject({ ...newProject, publish_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      data-testid="project-publish-date-input"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setNewProject({ name: '', platform: 'Both', description: '', start_date: '', publish_date: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  data-testid="cancel-button"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  data-testid="submit-project-button"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
