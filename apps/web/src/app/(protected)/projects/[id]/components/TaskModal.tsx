import React from 'react';

interface TaskForm {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  taskForm: TaskForm;
  setTaskForm: (form: TaskForm) => void;
  taskLoading: boolean;
  taskError: string | null;
  editingTask: string | null;
  onDelete?: () => void;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  taskForm,
  setTaskForm,
  taskLoading,
  taskError,
  editingTask,
  onDelete,
}: TaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-surface rounded-xl border border-border text-left overflow-hidden shadow-2xl sm:max-w-md sm:w-full w-full">
        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-primary">
              {editingTask ? 'Edit Task' : 'New Task'}
            </h3>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none">&times;</button>
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
              {editingTask && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="text-sm font-medium text-[#EF4444] hover:text-[#EF4444]/80 transition-colors"
                >
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
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
  );
}
