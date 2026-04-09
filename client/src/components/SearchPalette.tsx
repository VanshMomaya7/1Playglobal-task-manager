import { useState, useEffect, useRef } from 'react';
import { tasksApi } from '../api/tasks';
import type { Task } from '../api/tasks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPalette({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Execute Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayTimer = setTimeout(async () => {
      setLoading(true);
      try {
        // We fetch a wide array to locally search
        const res = await tasksApi.getAll({ limit: 100 });
        const allTasks = res.data;
        const lowQuery = query.toLowerCase();
        
        const filtered = allTasks.filter(t => 
           t.title.toLowerCase().includes(lowQuery) || 
           (t.description && t.description.toLowerCase().includes(lowQuery))
        );
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [query]);

  // Handle ESC mapping internally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-esc" onClick={onClose}>ESC</button>
        </div>

        {query.trim() && (
          <div className="search-results">
            {loading ? (
              <div className="search-empty">Searching…</div>
            ) : results.length > 0 ? (
              results.map(task => (
                <div className="search-result-item" key={task.id} onClick={() => {
                  // In a robust app, this would route to /tasks/:id or open task details. 
                  // For now, simply flash it or close
                  onClose();
                }}>
                  <div className="search-result-title">{task.title}</div>
                  <div className={`search-result-badge status-${task.status.replace('-','')} badge`}>
                    {task.status.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
              ))
            ) : (
              <div className="search-empty">No tasks found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
