import { useState, type FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { tasksApi } from '../api/tasks';
import type { Task, CreateTaskPayload, TaskStatus } from '../api/tasks';

interface Props {
  onCreated: () => void;
  initialTask?: Task | null;
}

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in-progress', 'done'];

export default function TaskForm({ onCreated, initialTask }: Props) {
  const [title, setTitle]             = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [status, setStatus]           = useState<TaskStatus>(initialTask?.status || 'todo');
  const [dueDate, setDueDate]         = useState<Date | null>(initialTask?.dueDate ? new Date(initialTask.dueDate) : null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }

    setLoading(true);
    setError('');
    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        ...(description.trim() && { description: description.trim() }),
        status,
        ...(dueDate && { dueDate: dueDate.toISOString() }),
      };
      if (initialTask) {
        await tasksApi.update(initialTask.id, payload);
      } else {
        await tasksApi.create(payload);
      }
      
      setTitle('');
      setDescription('');
      setStatus('todo');
      setDueDate(null);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message ?? (initialTask ? 'Failed to update task' : 'Failed to create task'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-section" style={{ margin: 0 }}>
      <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-banner" style={{ marginBottom: 16 }}>
              <span>⚠</span> {error}
            </div>
          )}
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                placeholder="Add more context (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group custom-datepicker">
              <label htmlFor="task-due">Due Date</label>
              <DatePicker
                id="task-due"
                selected={dueDate}
                onChange={(date: Date | null) => setDueDate(date)}
                placeholderText="Select due date"
                className="date-input"
                dateFormat="MMM d, yyyy"
                isClearable
              />
            </div>
            <div className="form-group" style={{ justifyContent: 'flex-end' }}>
              <label style={{ opacity: 0, userSelect: 'none' }}>_</label>
              <button
                id="create-task-btn"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {initialTask ? 'Saving…' : 'Creating…'}</>
                ) : (
                  <>{initialTask ? 'Save Changes' : <><span>＋</span> Add Task</>}</>
                )}
              </button>
            </div>
          </div>
        </form>
    </div>
  );
}
