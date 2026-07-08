import { useState } from 'react';
import {
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
import { Task } from '../types';
import { useToast } from '@/components/ui/Toast';

export function useKanbanDnd(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  updateTaskStatus: (id: string, newStatus: string) => Promise<void>,
  onFailureRollback: () => void
) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const toast = useToast();

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
      await updateTaskStatus(activeId as string, currentTask.status);
    } catch (err) {
      toast.error('Failed to update task status');
      onFailureRollback(); // revert on failure
    }
  };

  return {
    activeTask,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
