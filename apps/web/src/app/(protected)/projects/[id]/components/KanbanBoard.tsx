import React from 'react';
import {
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';
import { KanbanColumn, SortableTaskCard } from '../components';
import { Task } from '../types';
import { useKanbanDnd } from '../hooks/useKanbanDnd';

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  updateTaskStatus: (id: string, newStatus: string) => Promise<void>;
  onFailureRollback: () => void;
  onTaskClick: (task?: Task) => void;
  onTaskDelete: (id: string) => void;
}

export function KanbanBoard({
  tasks,
  setTasks,
  updateTaskStatus,
  onFailureRollback,
  onTaskClick,
  onTaskDelete,
}: KanbanBoardProps) {
  const {
    activeTask,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useKanbanDnd(tasks, setTasks, updateTaskStatus, onFailureRollback);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 items-start overflow-x-auto snap-x snap-mandatory scroll-pl-6 md:scroll-pl-0 pb-4 w-[calc(100%+3rem)] -ml-6 px-6 md:w-full md:ml-0 md:px-0 hide-scrollbar after:content-[''] after:w-6 after:shrink-0 md:after:hidden">
        <div className="w-[85vw] flex-shrink-0 snap-start md:w-auto md:flex-shrink">
          <KanbanColumn
            id="TODO"
            title="To Do"
            count={tasks.filter(t => t.status === 'TODO').length}
            dotColor="bg-text-secondary"
            tasks={tasks.filter(t => t.status === 'TODO')}
            onTaskClick={onTaskClick}
            onTaskDelete={onTaskDelete}
          />
        </div>
        <div className="w-[85vw] flex-shrink-0 snap-start md:w-auto md:flex-shrink">
          <KanbanColumn
            id="IN_PROGRESS"
            title="In Progress"
            count={tasks.filter(t => t.status === 'IN_PROGRESS').length}
            dotColor="bg-[#F59E0B]"
            tasks={tasks.filter(t => t.status === 'IN_PROGRESS')}
            onTaskClick={onTaskClick}
            onTaskDelete={onTaskDelete}
          />
        </div>
        <div className="w-[85vw] flex-shrink-0 snap-start md:w-auto md:flex-shrink">
          <KanbanColumn
            id="DONE"
            title="Done"
            count={tasks.filter(t => t.status === 'DONE').length}
            dotColor="bg-accent"
            tasks={tasks.filter(t => t.status === 'DONE')}
            onTaskClick={onTaskClick}
            onTaskDelete={onTaskDelete}
          />
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <SortableTaskCard task={activeTask} onClick={() => { }} onDelete={() => { }} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
