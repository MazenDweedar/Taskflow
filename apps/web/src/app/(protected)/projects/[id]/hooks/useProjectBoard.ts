import { useState, useEffect, useCallback } from 'react';
import { api, ApiException } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Confirm';
import { Project, Task } from '../types';

export function useProjectBoard(projectId: string) {
  const toast = useToast();
  const confirm = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', description: '' });

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '' });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

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

  // Project Actions
  const handleProjectEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
    try {
      await api.projects.update(projectId, projectForm);
      setIsProjectModalOpen(false);
      toast.success('Project updated');
      loadProjectAndTasks();
    } catch (err: any) {
      toast.error(err instanceof ApiException ? err.messages.join(', ') : 'Failed to update project');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleProjectDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? All tasks will be lost.',
      confirmText: 'Delete',
      isDanger: true
    });
    if (!confirmed) return;
    try {
      await api.projects.delete(projectId);
      toast.success('Project deleted');
      window.location.href = '/projects';
    } catch (err: any) {
      toast.error(err instanceof ApiException ? err.messages.join(', ') : 'Failed to delete project');
    }
  };

  // Task Actions
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
      const payload: any = { ...taskForm };
      if (!payload.dueDate) delete payload.dueDate;

      if (editingTask) {
        await api.tasks.update(editingTask, payload);
        toast.success('Task updated');
      } else {
        await api.tasks.create(projectId, payload);
        toast.success('Task created');
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
    const confirmed = await confirm({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      isDanger: true
    });
    if (!confirmed) return;
    try {
      await api.tasks.delete(id);
      toast.success('Task deleted');
      loadProjectAndTasks();
    } catch (err: any) {
      toast.error(err instanceof ApiException ? err.messages.join(', ') : 'Failed to delete task');
    }
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    try {
      await api.tasks.update(id, { status: newStatus });
      // We don't call loadProjectAndTasks() here because DND handles optimistic updates
      // The caller handles rolling back if this throws
    } catch (err: any) {
      throw err;
    }
  };

  return {
    project,
    tasks,
    setTasks,
    loading,
    error,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSearchQuery,
    isProjectModalOpen,
    setIsProjectModalOpen,
    projectForm,
    setProjectForm,
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    taskForm,
    setTaskForm,
    taskLoading,
    taskError,
    loadProjectAndTasks,
    handleProjectEditSubmit,
    handleProjectDelete,
    openTaskModal,
    handleTaskSubmit,
    handleTaskDelete,
    updateTaskStatus,
  };
}
