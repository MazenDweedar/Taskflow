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
  const [statusFilter, setStatusFilter] = useState('');
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
          status: statusFilter || undefined,
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
  }, [projectId, statusFilter, priorityFilter, debouncedSearch]);

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
      <div className="bg-surface shadow-sm rounded-xl border border-border p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-border bg-surface text-text-primary placeholder-text-secondary rounded-lg shadow-sm focus:ring-accent/50 focus:border-accent sm:text-sm py-2 px-3 border"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-border bg-surface text-text-primary rounded-lg shadow-sm focus:ring-accent/50 focus:border-accent sm:text-sm py-2 px-3 border"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border-border bg-surface text-text-primary rounded-lg shadow-sm focus:ring-accent/50 focus:border-accent sm:text-sm py-2 px-3 border"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center bg-white shadow rounded-lg p-12">
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="bg-surface shadow-sm overflow-hidden rounded-xl border border-border">
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id}>
                <div className="px-6 py-6 flex items-center justify-between hover:bg-bg/50 transition-colors">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-base font-medium text-text-primary truncate">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm text-text-secondary truncate">{task.description}</p>}
                    <div className="mt-3 flex items-center space-x-4 text-xs text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${task.priority === 'HIGH' ? 'bg-[#B5654A]' : task.priority === 'MEDIUM' ? 'bg-accent' : 'bg-text-secondary'}`}></span>
                        {task.priority}
                      </span>
                      {task.dueDate && <span>Due: {task.dueDate}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="text-sm border-border bg-surface text-text-primary rounded-lg py-1 pl-2 pr-8 focus:ring-accent/50 focus:border-accent mr-2"
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                    <button onClick={() => openTaskModal(task)} className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 border border-transparent hover:border-border rounded-lg transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleTaskDelete(task.id)} className="text-sm font-medium text-text-secondary hover:text-[#B5654A] px-3 py-2 border border-transparent hover:border-[#B5654A]/30 hover:bg-[#B5654A]/5 rounded-lg transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
