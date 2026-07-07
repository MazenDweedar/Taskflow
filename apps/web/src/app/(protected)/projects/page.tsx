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
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center bg-white shadow rounded-lg p-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
          <div className="mt-6">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${project.id}`} className="block hover:bg-gray-50">
                      <p className="text-sm font-medium text-indigo-600 truncate">{project.name}</p>
                      <p className="mt-1 text-sm text-gray-500 truncate">{project.description || 'No description'}</p>
                    </Link>
                  </div>
                  <div className="flex-shrink-0 flex gap-2 ml-4">
                    <button
                      onClick={() => openEditModal(project)}
                      className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-2 py-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-900 px-2 py-1"
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
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {isEditing ? 'Edit Project' : 'Create Project'}
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                        />
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                        />
                      </div>
                      {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {formLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
