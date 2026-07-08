'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiException } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/Confirm';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn, SortableTaskCard } from './components';
import Link from 'next/link';

type Project = { id: string; name: string; description: string | null };
type Task = { id: string; title: string; description: string | null; status: string; priority: string; dueDate: string | null };

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const toast = useToast();
  const confirm = useConfirm();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DND
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

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
      // Project is gone, go back to empty state
      window.location.href = '/projects';
    } catch (err: any) {
      toast.error(err instanceof ApiException ? err.messages.join(', ') : 'Failed to delete project');
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.tasks.update(id, { status: newStatus });
      loadProjectAndTasks();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setTasks(prevTasks => {
      const activeIndex = prevTasks.findIndex(t => t.id === activeId);
      const overIndex = prevTasks.findIndex(t => t.id === overId);

      if (isOverTask) {
        if (prevTasks[activeIndex].status !== prevTasks[overIndex].status) {
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: prevTasks[overIndex].status };
          return newTasks;
        }
      }

      if (isOverColumn) {
        if (prevTasks[activeIndex].status !== overId) {
          const newTasks = [...prevTasks];
          newTasks[activeIndex] = { ...newTasks[activeIndex], status: overId as string };
          return newTasks;
        }
      }

      return prevTasks;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    // The state was already updated eagerly in onDragOver
    const currentTask = tasks.find(t => t.id === activeId);
    if (!currentTask) return;

    try {
      await api.tasks.update(activeId as string, { status: currentTask.status });
    } catch (err) {
      toast.error('Failed to update task status');
      loadProjectAndTasks(); // revert on failure
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
      {/* Header */}
      <div className="mb-10 mt-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 group">
              <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight break-words">{project?.name}</h1>
              <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 mt-1 md:mt-2">
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
                  className="p-1.5 text-[#EF4444] md:text-text-secondary md:hover:text-[#EF4444] rounded hover:bg-[#EF4444]/10 transition-colors"
                  title="Delete Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed">{project?.description || 'No description provided.'}</p>
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
      <div className="mb-6 flex flex-row gap-3 items-center w-full">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/60 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface border border-border text-text-primary placeholder-text-secondary rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-sm transition-colors"
          />
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setIsPriorityOpen(!isPriorityOpen)}
            className="flex items-center gap-2 bg-surface border border-border text-text-primary rounded-lg py-1.5 px-3 hover:border-text-secondary focus:outline-none focus:ring-1 focus:ring-accent text-sm transition-all"
          >
            <span className="text-text-secondary/70">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
              </svg>
            </span>
            <span className="font-medium hidden sm:inline-block">{priorityFilter === '' ? 'All Priorities' : priorityFilter === 'LOW' ? 'Low Priority' : priorityFilter === 'MEDIUM' ? 'Medium Priority' : 'High Priority'}</span>
            <span className="font-medium sm:hidden">{priorityFilter === '' ? 'All' : priorityFilter === 'LOW' ? 'Low' : priorityFilter === 'MEDIUM' ? 'Med' : 'High'}</span>
          </button>
          {isPriorityOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsPriorityOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-40 bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right">
                <ul className="py-1">
                  {[
                    { value: '', label: 'All Priorities' },
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' }
                  ].map((option) => (
                    <li key={option.value}>
                      <button
                        onClick={() => {
                          setPriorityFilter(option.value);
                          setIsPriorityOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${priorityFilter === option.value ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'}`}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Loading tasks...</div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 items-start overflow-x-auto snap-x snap-mandatory scroll-pl-4 md:scroll-pl-0 pb-4 w-full -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar after:content-[''] after:w-4 after:shrink-0 md:after:hidden">
            <div className="w-[85vw] flex-shrink-0 snap-start md:w-auto md:flex-shrink">
              <KanbanColumn
                id="TODO"
                title="To Do"
                count={tasks.filter(t => t.status === 'TODO').length}
                dotColor="bg-text-secondary"
                tasks={tasks.filter(t => t.status === 'TODO')}
                onTaskClick={openTaskModal}
                onTaskDelete={handleTaskDelete}
              />
            </div>
            <div className="w-[85vw] flex-shrink-0 snap-start md:w-auto md:flex-shrink">
              <KanbanColumn
                id="IN_PROGRESS"
                title="In Progress"
                count={tasks.filter(t => t.status === 'IN_PROGRESS').length}
                dotColor="bg-[#F59E0B]"
                tasks={tasks.filter(t => t.status === 'IN_PROGRESS')}
                onTaskClick={openTaskModal}
                onTaskDelete={handleTaskDelete}
              />
            </div>
            <div className="w-[85vw] flex-shrink-0 snap-start md:w-auto md:flex-shrink">
              <KanbanColumn
                id="DONE"
                title="Done"
                count={tasks.filter(t => t.status === 'DONE').length}
                dotColor="bg-accent"
                tasks={tasks.filter(t => t.status === 'DONE')}
                onTaskClick={openTaskModal}
                onTaskDelete={handleTaskDelete}
              />
            </div>
          </div>
          <DragOverlay>
            {activeTask ? (
              <SortableTaskCard task={activeTask} onClick={() => { }} onDelete={() => { }} />
            ) : null}
          </DragOverlay>
        </DndContext>
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
              <div className="px-6 py-4 border-t border-border flex justify-between items-center">
                <div>
                  {editingTask && (
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Delete Task',
                          message: 'Are you sure you want to delete this task?',
                          confirmText: 'Delete',
                          isDanger: true
                        });
                        if (confirmed) {
                          try {
                            await api.tasks.delete(editingTask);
                            toast.success('Task deleted');
                            setIsTaskModalOpen(false);
                            loadProjectAndTasks();
                          } catch (err: any) {
                            toast.error('Failed to delete task');
                          }
                        }
                      }}
                      className="text-sm font-medium text-[#EF4444] hover:text-[#EF4444]/80 transition-colors"
                    >
                      Delete Task
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
