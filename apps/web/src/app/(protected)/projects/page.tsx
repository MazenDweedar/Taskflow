'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, ApiException } from '@/lib/api';

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
};

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setFormData({ name: '', description: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const proj = await api.projects.create(formData) as { id: string };
      setIsModalOpen(false);
      // Force reload to update sidebar and go to new project
      window.location.href = `/projects/${proj.id}`;
    } catch (err: any) {
      setFormError(err instanceof ApiException ? err.messages.join(', ') : 'Failed to save project');
      setFormLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center min-h-[70vh]">
      <div className="text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <span className="text-2xl text-text-secondary">📁</span>
        </div>
        <h3 className="text-xl font-bold text-text-primary">No project selected</h3>
        <p className="mt-2 text-sm text-text-secondary">Select a project from the sidebar, or create a new one</p>
        <div className="mt-8">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-xl text-bg bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent transition-colors"
          >
            <span>+</span> New Project
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-surface rounded-xl border border-border text-left overflow-hidden shadow-2xl sm:max-w-md sm:w-full w-full">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold text-text-primary">
                  New Project
                </h3>
                <button type="button" onClick={closeModal} className="text-text-secondary hover:text-text-primary transition-colors text-xl leading-none">&times;</button>
              </div>
              <div className="px-6 py-5 space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Project Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full sm:text-sm bg-bg border-border text-text-primary placeholder-text-secondary rounded-lg py-2.5 px-3 border focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="e.g. Website Redesign"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="block w-full sm:text-sm bg-bg border border-border text-text-primary placeholder-text-secondary rounded-lg py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="What is this project about?"
                  />
                </div>
                {formError && <p className="text-sm text-red-500">{formError}</p>}
              </div>
              <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex justify-center rounded-lg border border-border px-4 py-2 bg-transparent text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover focus:outline-none transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex justify-center rounded-lg border border-transparent px-4 py-2 bg-accent text-sm font-medium text-bg hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent disabled:opacity-50 transition-colors"
                >
                  {formLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
