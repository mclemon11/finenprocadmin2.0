import { useEffect, useState, useCallback } from 'react';
import {
  subscribeProjectTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/tasks.service';

/**
 * Hook for project tasks (real-time)
 */
export function useProjectTasks(projectId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeProjectTasks(projectId, (t) => {
      setTasks(t);
      setLoading(false);
    });
    return () => unsub();
  }, [projectId]);

  const addTask = useCallback(
    async (taskData) => {
      return await createTask({ ...taskData, projectId });
    },
    [projectId]
  );

  const editTask = useCallback(async (taskId, updates) => {
    await updateTask(taskId, updates);
  }, []);

  const removeTask = useCallback(async (taskId) => {
    await deleteTask(taskId);
  }, []);

  return { tasks, loading, addTask, editTask, removeTask };
}
