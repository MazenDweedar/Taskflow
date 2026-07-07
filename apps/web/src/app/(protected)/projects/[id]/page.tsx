'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiException } from '@/lib/api';

type Project = { id: string; name: string; description: string | null };
type Task = { id: string; title: string; description: string | null; status: string; priority: string; dueDate: string | null };

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '' });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Project Edit Modal
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadProjectAndTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [proj, tsk] = await Promise.all([
        api.projects.get(projectId),
        api.tasks.list(projectId, {
          priority: priorityFilter || undefined,
          search: debouncedSearch || undefined,
        })
      ]);
      setProject(proj as Project);
      setTasks(tsk as Task[]);
    } catch (err: any) {
      if (err instanceof ApiException && err.statusCode === 404) {
        setError('Project not found');
      } else {
        setError(err instanceof ApiException ? err.messages.join(', ') : 'Failed to load project details');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, priorityFilter, debouncedSearch]);

  useEffect(() => {
    loadProjectAndTasks();
  }, [loadProjectAndTasks]);

  const handleProjectEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true); // Reusing loading state for simplicity
    try {
      await api.projects.update(projectId, projectForm);
      setIsProjectModalOpen(false);
      loadProjectAndTasks();
    } catch (err: any) {
      alert(err instanceof ApiException ? err.messages.join(', ') : 'Failed to update project');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleProjectDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? All tasks will be lost.')) return;
    try {
      await api.projects.delete(projectId);
      // Project is gone, go back to empty state
      window.location.href = '/projects';
    } catch (err: any) {
      alert(err instanceof ApiException ? err.messages.join(', ') : 'Failed to delete project');
    }
  };

  const openTaskModal = (task?: Task) => {
    setTaskError(null);
    if (task) {
      setEditingTask(task.id);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate || '',
      });
    } else {
      setEditingTask(null);
      setTaskForm({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '' });
    }
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
    setTaskError(null);
    try {
      // Due date logic: if empty, send null/undefined. The DTO expects ISO format if present.
      // But passing empty string might fail class-validator. We only pass dueDate if not empty.
      const payload: any = { ...taskForm };
      if (!payload.dueDate) delete payload.dueDate;

      if (editingTask) {
        await api.tasks.update(editingTask, payload);
      } else {
        await api.tasks.create(projectId, payload);
      }
      setIsTaskModalOpen(false);
      loadProjectAndTasks();
    } catch (err: any) {
      setTaskError(err instanceof ApiException ? err.messages.join(', ') : 'Failed to save task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleTaskDelete = async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.tasks.delete(id);
      loadProjectAndTasks();
    } catch (err: any) {
      alert(err instanceof ApiException ? err.messages.join(', ') : 'Failed to delete task');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.tasks.update(id, { status: newStatus });
      loadProjectAndTasks();
    } catch (err: any) {
      alert('Failed to update status');
    }
  };

  if (loading && !project) {
    return <div className="py-12 text-center">Loading...</div>;
  }

  if (error && !project) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
        <Link href="/projects" className="text-indigo-600 hover:text-indigo-900">
          ← Back to projects
        </Link>
      </div>
    );
  }

  return (
      {/* Header */}
      <div className="mb-10 mt-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 group">
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">{project?.name}</h1>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
                <button
                  onClick={() => {
                    setProjectForm({ name: project?.name || '', description: project?.description || '' });
                    setIsProjectModalOpen(true);
                  }}
                  className="p-1.5 text-text-secondary hover:text-text-primary rounded hover:bg-surface-hover transition-colors"
                  title="Edit Project"
                >
                  <span className="text-sm">✎</span>
                </button>
                <button
                  onClick={handleProjectDelete}
                  className="p-1.5 text-text-secondary hover:text-[#EF4444] rounded hover:bg-[#EF4444]/10 transition-colors"
                  title="Delete Project"
                >
                  <span className="text-sm">🗑</span>
                </button>
              </div>
            </div>
            <p className="mt-3 text-base text-text-secondary max-w-3xl leading-relaxed">{project?.description || 'No description provided.'}</p>
          </div>
          <button
            onClick={() => openTaskModal()}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-bg bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent transition-colors mt-1"
          >
            <span className="text-lg leading-none">+</span> Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border text-text-primary placeholder-text-secondary rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm transition-colors"
          />
        </div>
        <div className="w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto bg-surface border border-border text-text-primary rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent sm:text-sm py-2 px-3 transition-colors appearance-none"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Loading tasks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* TO DO COLUMN */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-text-secondary"></div>
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">To Do</h3>
              <span className="ml-auto text-xs text-text-secondary font-medium bg-surface px-2 py-0.5 rounded-full border border-border">
                {tasks.filter(t => t.status === 'TODO').length}
              </span>
            </div>
            {tasks.filter(t => t.status === 'TODO').map(task => (
              <div key={task.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-text-secondary transition-colors group cursor-pointer" onClick={() => openTaskModal(task)}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-text-primary text-sm leading-snug">{task.title}</h4>
                </div>
                {task.description && <p className="text-xs text-text-secondary line-clamp-2 mb-3">{task.description}</p>}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-md font-medium ${task.priority === 'HIGH' ? 'bg-[#EF4444]/10 text-[#EF4444]' : task.priority === 'MEDIUM' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-accent/10 text-accent'}`}>
                    {task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                  </span>
                  {task.dueDate && <span className="text-text-secondary">Due {task.dueDate}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* IN PROGRESS COLUMN */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">In Progress</h3>
              <span className="ml-auto text-xs text-text-secondary font-medium bg-surface px-2 py-0.5 rounded-full border border-border">
                {tasks.filter(t => t.status === 'IN_PROGRESS').length}
              </span>
            </div>
            {tasks.filter(t => t.status === 'IN_PROGRESS').map(task => (
              <div key={task.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-text-secondary transition-colors group cursor-pointer" onClick={() => openTaskModal(task)}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-text-primary text-sm leading-snug">{task.title}</h4>
                </div>
                {task.description && <p className="text-xs text-text-secondary line-clamp-2 mb-3">{task.description}</p>}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-md font-medium ${task.priority === 'HIGH' ? 'bg-[#EF4444]/10 text-[#EF4444]' : task.priority === 'MEDIUM' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-accent/10 text-accent'}`}>
                    {task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                  </span>
                  {task.dueDate && <span className="text-text-secondary">Due {task.dueDate}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* DONE COLUMN */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">Done</h3>
              <span className="ml-auto text-xs text-text-secondary font-medium bg-surface px-2 py-0.5 rounded-full border border-border">
                {tasks.filter(t => t.status === 'DONE').length}
              </span>
            </div>
            {tasks.filter(t => t.status === 'DONE').map(task => (
              <div key={task.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-text-secondary transition-colors group cursor-pointer opacity-60" onClick={() => openTaskModal(task)}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-text-primary text-sm leading-snug line-through">{task.title}</h4>
                </div>
                {task.description && <p className="text-xs text-text-secondary line-clamp-2 mb-3 line-through">{task.description}</p>}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-1 rounded-md font-medium ${task.priority === 'HIGH' ? 'bg-[#EF4444]/10 text-[#EF4444]' : task.priority === 'MEDIUM' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-accent/10 text-accent'}`}>
                    {task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
                  </span>
                  {task.dueDate && <span className="text-text-secondary">Due {task.dueDate}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Edit Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsProjectModalOpen(false)}></div>
          <div className="relative bg-surface rounded-xl border border-border text-left overflow-hidden shadow-2xl sm:max-w-md sm:w-full w-full">
            <form onSubmit={handleProjectEditSubmit}>
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary">
                  Edit Project
                </h3>
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="block w-full sm:text-sm bg-bg border border-border text-text-primary placeholder-text-secondary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="block w-full sm:text-sm bg-bg border border-border text-text-primary placeholder-text-secondary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="inline-flex justify-center rounded-lg border border-border px-4 py-2 bg-transparent text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskLoading}
                  className="inline-flex justify-center rounded-lg border border-transparent px-4 py-2 bg-accent text-sm font-medium text-bg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent disabled:opacity-50 transition-colors"
                >
                  {taskLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsTaskModalOpen(false)}></div>
          <div className="relative bg-surface rounded-xl border border-border text-left overflow-hidden shadow-2xl sm:max-w-md sm:w-full w-full">
            <form onSubmit={handleTaskSubmit}>
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary">
                  {editingTask ? 'Edit Task' : 'New Task'}
                </h3>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="block w-full sm:text-sm bg-bg border border-border text-text-primary placeholder-text-secondary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Description (optional)</label>
                  <textarea
                    rows={2}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="block w-full sm:text-sm bg-bg border border-border text-text-primary placeholder-text-secondary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      className="block w-full sm:text-sm bg-bg border border-border text-text-primary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="block w-full sm:text-sm bg-bg border border-border text-text-primary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Due Date (optional)</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="block w-full sm:text-sm bg-bg border border-border text-text-primary placeholder-text-secondary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                  />
                </div>
                {taskError && <p className="text-sm text-red-500">{taskError}</p>}
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="inline-flex justify-center rounded-lg border border-border px-4 py-2 bg-transparent text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskLoading}
                  className="inline-flex justify-center rounded-lg border border-transparent px-4 py-2 bg-accent text-sm font-medium text-bg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent disabled:opacity-50 transition-colors"
                >
                  {taskLoading ? 'Saving...' : (editingTask ? 'Save Changes' : 'Add Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
