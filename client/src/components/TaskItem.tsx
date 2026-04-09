import { useState, type ChangeEvent } from 'react';
import { tasksApi } from '../api/tasks';
import type { Task, TaskStatus } from '../api/tasks';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  task: Task;
  onUpdated: () => void;
  onDeleted: () => void;
  onEditTask: (task: Task) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function isOverdue(dueDate?: string, status?: string) {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export default function TaskItem({ task, onUpdated, onDeleted, onEditTask }: Props) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const statusClass = task.status === 'in-progress' ? 'in-progress' : task.status;
  const cardClass = `task-card status-${statusClass === 'in-progress' ? 'inprogress' : statusClass}`;

  const handleStatusChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as TaskStatus;
    setUpdating(true);
    try {
      await tasksApi.update(task.id, { status: newStatus });
      onUpdated();
    } catch {
      // silently fail — user can retry
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setDeleting(true);
    try {
      await tasksApi.delete(task.id);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  const overdue = isOverdue(task.dueDate, task.status);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (deleting ? 0.4 : 1),
    cursor: 'grab',
  };

  const tagRegex = /#(\w+)/g;
  const tags: string[] = [];

  let displayTitle = task.title;
  let displayDesc = task.description || '';

  const titleMatch = [...displayTitle.matchAll(tagRegex)];
  const descMatch = [...displayDesc.matchAll(tagRegex)];

  titleMatch.forEach(m => tags.push(m[1]));
  descMatch.forEach(m => tags.push(m[1]));

  displayTitle = displayTitle.replace(tagRegex, '').trim();
  displayDesc = displayDesc.replace(tagRegex, '').trim();

  return (
    <div
      className={cardClass}
      id={`task-${task.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => onEditTask(task)}
    >
      <div className="task-card-body">
        <div className="task-tags">
          {tags.map(tag => (
            <span key={tag} className="task-tag">#{tag}</span>
          ))}
        </div>
        <div className="task-title">{displayTitle}</div>
        {displayDesc && (
          <div className="task-description">{displayDesc}</div>
        )}
        <div className="task-meta">
          <span className="task-id">#{task.id}</span>
          {task.dueDate && (
            <span className="task-due" style={overdue ? { color: '#f87171' } : {}}>
              <span className="task-due-icon">{overdue ? '⚠' : ''}</span>
              {overdue ? 'Overdue · ' : ''}{formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions" onPointerDown={(e) => e.stopPropagation()}>
        <select
          id={`status-select-${task.id}`}
          className={`status-select ${statusClass}`}
          value={task.status}
          onChange={handleStatusChange}
          disabled={updating}
          aria-label="Update task status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id={`edit-task-${task.id}`}
            className="btn btn-outline"
            onClick={() => onEditTask(task)}
            style={{ padding: '6px 12px', fontSize: 13, flexShrink: 0 }}
            aria-label={`Edit task ${task.id}`}
            disabled={deleting}
          >
            ✎ Edit
          </button>
          <button
            id={`delete-task-${task.id}`}
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
            style={{ padding: '6px 12px', fontSize: 13, flexShrink: 0 }}
            aria-label={`Delete task ${task.id}`}
          >
            {deleting ? '…' : '✕ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
