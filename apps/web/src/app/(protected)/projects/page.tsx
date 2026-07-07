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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.projects.list();
      setProjects(data);
    } catch (err: any) {
      setError(err instanceof ApiException ? err.messages.join(', ') : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setIsEditing(null);
    setFormData({ name: '', description: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setIsEditing(project.id);
    setFormData({ name: project.name, description: project.description || '' });
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
      if (isEditing) {
        await api.projects.update(isEditing, formData);
      } else {
        await api.projects.create(formData);
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err instanceof ApiException ? err.messages.join(', ') : 'Failed to save project');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project? All tasks will be lost.')) return;
    
    try {
      await api.projects.delete(id);
      fetchProjects();
    } catch (err: any) {
      alert(err instanceof ApiException ? err.messages.join(', ') : 'Failed to delete project');
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="py-12">
        <div className="text-center">Loading projects...</div>
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={fetchProjects} className="text-indigo-600 hover:text-indigo-900 font-medium">Try again</button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-serif text-text-primary">Projects</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50 transition-colors"
        >
          Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center bg-surface shadow-sm rounded-xl border border-border p-12">
          <h3 className="mt-2 text-sm font-medium text-text-primary">No projects</h3>
          <p className="mt-1 text-sm text-text-secondary">Get started by creating a new project.</p>
          <div className="mt-6">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50 transition-colors"
            >
              New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface shadow-sm overflow-hidden rounded-xl border border-border">
          <ul className="divide-y divide-border">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="px-6 py-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${project.id}`} className="block group">
                      <p className="text-base font-medium text-text-primary truncate group-hover:text-accent transition-colors">{project.name}</p>
                      <p className="mt-1 text-sm text-text-secondary truncate">{project.description || 'No description'}</p>
                    </Link>
                  </div>
                  <div className="flex-shrink-0 flex gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(project)}
                      className="text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-2 border border-transparent hover:border-border rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-sm font-medium text-text-secondary hover:text-[#B5654A] px-3 py-2 border border-transparent hover:border-[#B5654A]/30 hover:bg-[#B5654A]/5 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl sm:max-w-lg sm:w-full w-full">
            <form onSubmit={handleSubmit}>
                <div className="bg-surface px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-lg">
                  <div>
                    <h3 className="text-lg leading-6 font-serif text-text-primary" id="modal-title">
                      {isEditing ? 'Edit Project' : 'Create Project'}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-primary">Name</label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full sm:text-sm border-border text-text-primary placeholder-text-secondary rounded-md py-2 px-3 border focus:outline-none focus:ring-accent/50 focus:border-accent"
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-text-primary">Description</label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="mt-1 block w-full sm:text-sm border border-border text-text-primary placeholder-text-secondary rounded-md py-2 px-3 focus:outline-none focus:ring-accent/50 focus:border-accent"
                        />
                      </div>
                      {formError && <p className="text-sm text-[#B5654A]">{formError}</p>}
                    </div>
                  </div>
                </div>
                <div className="bg-bg px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border rounded-b-lg">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-accent text-base font-medium text-white hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                  >
                    {formLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-border shadow-sm px-4 py-2 bg-surface text-base font-medium text-text-primary hover:bg-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-border sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
