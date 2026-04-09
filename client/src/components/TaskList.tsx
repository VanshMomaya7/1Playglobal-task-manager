import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../api/tasks';
import TaskItem from './TaskItem';
import { useState } from 'react';
import { tasksApi } from '../api/tasks';

interface Props {
  tasks: Task[];
  loading: boolean;
  error: string;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onUpdated: () => void;
  onDeleted: () => void;
  activeFilter: string;
  onTaskMove: (taskId: number, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

function KanbanColumn({ status, title, tasks, onUpdated, onDeleted, onEditTask }: any) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className={`kanban-column status-${status.replace('-', '')}`} ref={setNodeRef}>
      <div className="kanban-column-header">
        <span>{title}</span>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <div className="kanban-task-list">
        <SortableContext items={tasks.map((t: Task) => t.id)} strategy={rectSortingStrategy}>
          {tasks.map((task: Task) => (
            <TaskItem key={task.id} task={task} onUpdated={onUpdated} onDeleted={onDeleted} onEditTask={onEditTask} />
          ))}
        </SortableContext>
      </div>
      <div className="kanban-column-footer">
        <QuickAdd status={status} onUpdated={onUpdated} />
      </div>
    </div>
  );
}

function QuickAdd({ status, onUpdated }: { status: TaskStatus, onUpdated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await tasksApi.create({ title, status });
      setTitle('');
      setIsOpen(false);
      onUpdated();
    } catch {
       // Silently skip
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button className="quick-add-trigger" onClick={() => setIsOpen(true)}>
        + Add a Card
      </button>
    );
  }

  return (
    <form className="quick-add-form" onSubmit={handleSubmit}>
      <input 
        autoFocus
        type="text" 
        placeholder="Task name..." 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        disabled={loading}
      />
      <div className="quick-add-actions">
         <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !title.trim()}>Add</button>
         <button type="button" className="btn btn-icon" onClick={() => setIsOpen(false)}>✕</button>
      </div>
    </form>
  );
}

export default function TaskList({
  tasks, loading, error, total, page, totalPages,
  onPageChange, onUpdated, onDeleted, activeFilter, onTaskMove, onEditTask
}: Props) {

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    // We embedded the column statuses directly as droppable IDs ('todo', 'in-progress', 'done')
    // We also have sortable items (taskId), so we need to know the destination.
    // If over.id matches one of the column statuses:
    let newStatus = over.id as TaskStatus;
    
    // If we dropped over a task rather than the empty column, find its status
    const overTask = tasks.find(t => t.id === over.id);
    if (overTask) newStatus = overTask.status;

    if (newStatus && ['todo', 'in-progress', 'done'].includes(newStatus)) {
      onTaskMove(active.id as number, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading tasks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <span>⚠</span> {error}
      </div>
    );
  }

  const filterLabel = activeFilter === 'all' ? 'tasks' : `${activeFilter} tasks`;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="task-list-section">
      <div className="tasks-header" style={{ display: 'none' }}>
        <span className="tasks-count">{total} {filterLabel}</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          <KanbanColumn status="todo" title="To Do" tasks={todoTasks} onUpdated={onUpdated} onDeleted={onDeleted} onEditTask={onEditTask} />
          <KanbanColumn status="in-progress" title="In Progress" tasks={inProgressTasks} onUpdated={onUpdated} onDeleted={onDeleted} onEditTask={onEditTask} />
          <KanbanColumn status="done" title="Done" tasks={doneTasks} onUpdated={onUpdated} onDeleted={onDeleted} onEditTask={onEditTask} />
        </div>
      </DndContext>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>← Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next →</button>
        </div>
      )}
    </div>
  );
}
