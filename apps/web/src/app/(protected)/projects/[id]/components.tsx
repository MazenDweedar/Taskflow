import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

type Task = { id: string; title: string; description: string | null; status: string; priority: string; dueDate: string | null };

export function SortableTaskCard({ task, onClick, onDelete }: { task: Task; onClick: () => void; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-text-secondary transition-colors group cursor-grab active:cursor-grabbing ${task.status === 'DONE' ? 'opacity-60' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className={`font-semibold text-text-primary text-base leading-snug pr-2 ${task.status === 'DONE' ? 'line-through' : ''}`}>{task.title}</h4>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-[#EF4444] transition-all p-1.5 rounded-lg hover:bg-[#EF4444]/10 -mt-1.5 -mr-1.5"
          title="Delete Task"
        >
          <span className="text-sm leading-none">🗑</span>
        </button>
      </div>
      {task.description && <p className={`text-sm text-text-secondary line-clamp-2 mb-4 ${task.status === 'DONE' ? 'line-through' : ''}`}>{task.description}</p>}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded-md font-medium ${task.priority === 'HIGH' ? 'bg-[#EF4444]/10 text-[#EF4444]' : task.priority === 'MEDIUM' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-accent/10 text-accent'}`}>
          {task.priority === 'HIGH' ? 'High' : task.priority === 'MEDIUM' ? 'Medium' : 'Low'}
        </span>
        {task.dueDate && <span className="text-text-secondary">Due {task.dueDate}</span>}
      </div>
    </div>
  );
}

export function KanbanColumn({ id, title, count, dotColor, tasks, onTaskClick, onTaskDelete }: { id: string; title: string; count: number; dotColor: string; tasks: Task[]; onTaskClick: (task: Task) => void; onTaskDelete: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
        <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">{title}</h3>
        <span className="ml-auto text-xs text-text-secondary font-medium bg-surface px-2 py-0.5 rounded-full border border-border">
          {count}
        </span>
      </div>
      <div 
        ref={setNodeRef}
        className={`flex flex-col gap-4 min-h-[150px] rounded-xl p-2 -m-2 transition-colors ${isOver ? 'bg-surface-hover' : ''}`}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard 
              key={task.id} 
              task={task} 
              onClick={() => onTaskClick(task)}
              onDelete={() => onTaskDelete(task.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
