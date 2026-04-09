import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasks';
import type { Task, TaskStatus } from '../api/tasks';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import Modal from '../components/Modal';
import confetti from 'canvas-confetti';

const LIMIT = 50;

export default function Home() {
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toast, setToast]           = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const fetchTasks = useCallback(async (currentPage: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await tasksApi.getAll({ page: currentPage, limit: LIMIT });
      setTasks(res.data);
      setTotal(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(page);
  }, [page, fetchTasks]);

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCreated = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    fetchTasks(page);
    showToast('✓ Task saved');
  };

  const handleUpdated = () => {
    fetchTasks(page);
    showToast('✓ Task updated');
  };

  const handleDeleted = () => {
    const newPage = tasks.length === 1 && page > 1 ? page - 1 : page;
    setPage(newPage);
    fetchTasks(newPage);
    showToast('✓ Task deleted');
  };

  const handleTaskMove = async (taskId: number, newStatus: TaskStatus) => {
    const originalTasks = [...tasks];
    const taskIndex = originalTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;
    if (originalTasks[taskIndex].status === newStatus) return;

    // Optimistic UI Data Push
    const updatedTasks = [...originalTasks];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: newStatus };
    setTasks(updatedTasks);

    // Fire Confetti if newly completed
    if (newStatus === 'done') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34c759', '#2997ff', '#ffffff'] // Apple green, blue, white context
      });
    }

    try {
      await tasksApi.update(taskId, { status: newStatus });
      showToast('✓ Task moved');
    } catch (err) {
      // Revert if API fails
      setTasks(originalTasks);
      showToast('⚠ Failed to move task');
    }
  };

  const doneCount = tasks.filter(t => t.status === 'done').length;
  const metricsPercent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600 }}>Board</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Drag and drop to shift stages.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Task
        </button>
      </div>

      <div className="metrics-bar" style={{ margin: '16px 0 24px', background: 'var(--bg-card)', padding: 16, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
         <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)'}}>Productivity Metric</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)'}}>{metricsPercent}% Task Completion</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
               <div style={{ width: `${metricsPercent}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.5s ease' }} />
            </div>
         </div>
      </div>

      <TaskList
        tasks={tasks}
        loading={loading}
        error={error}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
        activeFilter="all"
        onTaskMove={handleTaskMove}
        onEditTask={openEditModal}
      />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} title={editingTask ? "Edit Task" : "Create New Task"}>
        {/* We use key to strictly unmount the form when changing editing tasks so context doesn't pollute */}
        <TaskForm key={editingTask?.id || 'new'} onCreated={handleCreated} initialTask={editingTask} />
      </Modal>

      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </>
  );
}
