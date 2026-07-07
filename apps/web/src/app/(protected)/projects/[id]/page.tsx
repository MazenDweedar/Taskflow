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
      setProject(proj);
      setTasks(tsk);
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
    <div>
      <div className="mb-4">
        <Link href="/projects" className="text-sm text-indigo-600 hover:text-indigo-900">
          &larr; Back to projects
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
            <p className="mt-2 text-gray-600">{project?.description || 'No description provided.'}</p>
          </div>
          <button
            onClick={() => {
              setProjectForm({ name: project?.name || '', description: project?.description || '' });
              setIsProjectModalOpen(true);
            }}
            className="text-sm text-indigo-600 border border-indigo-600 rounded px-3 py-1 hover:bg-indigo-50"
          >
            Edit Project
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
        <button
          onClick={() => openTaskModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"
          />
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"
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
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3 border"
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
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    {task.description && <p className="mt-1 text-sm text-gray-500 truncate">{task.description}</p>}
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${task.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 
                          task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {task.priority}
                      </span>
                      {task.dueDate && <span>Due: {task.dueDate}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center space-x-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="text-sm border-gray-300 rounded-md"
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                    <button onClick={() => openTaskModal(task)} className="text-sm text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                    <button onClick={() => handleTaskDelete(task.id)} className="text-sm text-red-600 hover:text-red-900">
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
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsProjectModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleProjectEditSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Project</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input required type="text" value={projectForm.name} onChange={(e) => setProjectForm({...projectForm, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea rows={3} value={projectForm.description} onChange={(e) => setProjectForm({...projectForm, description: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse">
                  <button type="submit" disabled={taskLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto text-sm">Save</button>
                  <button type="button" onClick={() => setIsProjectModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsTaskModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleTaskSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input required type="text" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea rows={2} value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={taskForm.status} onChange={(e) => setTaskForm({...taskForm, status: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border">
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="DONE">Done</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                        <select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border">
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                      <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm py-2 px-3 border" />
                    </div>
                    {taskError && <p className="text-sm text-red-600">{taskError}</p>}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse">
                  <button type="submit" disabled={taskLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 sm:ml-3 sm:w-auto text-sm">Save</button>
                  <button type="button" onClick={() => setIsTaskModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto text-sm">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
