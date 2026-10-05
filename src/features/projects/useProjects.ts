import { useCallback, useEffect, useRef, useState } from "react";
import { deleteProject, listProjects, saveProject, updateProjectStatus } from "./api";
import type { Project, ProjectInput, ProjectStatus } from "./types";

const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Could not complete the request. Please try again.";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await listProjects();
      if (request === generation.current) setProjects(result);
    } catch (failure) {
      if (request === generation.current) setLoadError(errorMessage(failure));
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => { void reload(); return () => { generation.current++; }; }, [reload]);

  async function mutate(operation: () => Promise<void>, message: string) {
    if (pending.current) return false;
    pending.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await operation();
      setSuccess(message);
      return true;
    } catch (failure) {
      setError(errorMessage(failure));
      return false;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const save = (id: number | null, input: ProjectInput) => mutate(async () => {
    const saved = await saveProject(id, input);
    setProjects(items => id === null ? [saved, ...items] : items.map(item => item.id === id ? saved : item));
  }, id === null ? "Project created." : "Project updated.");
  const updateStatus = (id: number, status: ProjectStatus) => mutate(async () => {
    const saved = await updateProjectStatus(id, status);
    setProjects(items => items.map(item => item.id === id ? saved : item));
  }, "Project status updated.");
  const remove = (project: Project) => {
    if (!window.confirm(`Delete “${project.name}”? This cannot be undone.`)) return;
    return mutate(async () => {
      await deleteProject(project.id);
      setProjects(items => items.filter(item => item.id !== project.id));
    }, "Project deleted.");
  };
  return { projects, loading, loadError, error, success, busy, reload, save, updateStatus, remove,
    clearFeedback: () => { setError(""); setSuccess(""); } };
}
