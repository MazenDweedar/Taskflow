'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

import { useProjectBoard } from './hooks/useProjectBoard';
import { ProjectHeader } from './components/ProjectHeader';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectEditModal } from './components/ProjectEditModal';
import { TaskModal } from './components/TaskModal';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const {
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
  } = useProjectBoard(projectId);

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
      <ProjectHeader
        project={project}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        onEditProject={() => {
          setProjectForm({ name: project?.name || '', description: project?.description || '' });
          setIsProjectModalOpen(true);
        }}
        onDeleteProject={handleProjectDelete}
        onAddTask={() => openTaskModal()}
      />

      {loading ? (
        <div className="text-center py-12 text-text-secondary">Loading tasks...</div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          setTasks={setTasks}
          updateTaskStatus={updateTaskStatus}
          onFailureRollback={loadProjectAndTasks}
          onTaskClick={openTaskModal}
          onTaskDelete={handleTaskDelete}
        />
      )}

      <ProjectEditModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectEditSubmit}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        loading={taskLoading}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        taskLoading={taskLoading}
        taskError={taskError}
        editingTask={editingTask}
        onDelete={editingTask ? () => handleTaskDelete(editingTask) : undefined}
      />
    </div>
  );
}
