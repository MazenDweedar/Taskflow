import React from 'react';

interface ProjectForm {
  name: string;
  description: string;
}

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  projectForm: ProjectForm;
  setProjectForm: (form: ProjectForm) => void;
  loading: boolean;
}

export function ProjectEditModal({
  isOpen,
  onClose,
  onSubmit,
  projectForm,
  setProjectForm,
  loading,
}: ProjectEditModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative bg-surface rounded-xl border border-border text-left overflow-hidden shadow-2xl sm:max-w-md sm:w-full w-full">
        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-primary">
              Edit Project
            </h3>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none">&times;</button>
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
              onClick={onClose}
              className="inline-flex justify-center rounded-lg border border-border px-4 py-2 bg-transparent text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover focus:outline-none transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-lg border border-transparent px-4 py-2 bg-accent text-sm font-medium text-bg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
