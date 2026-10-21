import { createFileRoute } from "@tanstack/react-router";
import { LogIn, LogOut, Minus, Plus, Target, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { S141Logo } from "@/components/s141-logo";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type Task = {
  id: string;
  name: string;
  progress: number;
};

const STORAGE_KEY = "momentum-progress-tasks";
const DEMO_TASKS: Task[] = [
  { id: "demo-1", name: "Launch portfolio", progress: 65 },
  { id: "demo-2", name: "Read 24 books", progress: 30 },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Progress of 141" },
      {
        name: "description",
        content: "Create animated progress bars and keep every goal moving forward.",
      },
      { property: "og:title", content: "Progress of 141" },
      {
        property: "og:description",
        content: "Create animated progress bars and keep every goal moving forward.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressDashboard,
});

function ProgressDashboard() {
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [taskName, setTaskName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [dataOwner, setDataOwner] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;

    async function initializeAuth() {
      if (!isSupabaseConfigured) {
        if (active) setAuthReady(true);
        return;
      }
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) setUser(data.session?.user ?? null);

        const authState = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) setUser(session?.user ?? null);
        });
        subscription = authState.data.subscription;
      } catch (error) {
        if (active) setAuthError(error instanceof Error ? error.message : "Unable to connect to Supabase.");
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void initializeAuth();
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let active = true;

    async function loadTasks() {
      setDataOwner(null);
      try {
        if (user) {
          const { data, error } = await supabase
            .from("tasks")
            .select("id, name, progress")
            .order("created_at", { ascending: true });
          if (error) throw error;

          const cloudTasks = (data ?? []) as Task[];
          if (cloudTasks.length > 0) {
            if (active) setTasks(cloudTasks);
          } else {
            const localTasks = readLocalTasks();
            if (active) setTasks(localTasks);
            if (localTasks.length > 0) await saveTasks(user.id, localTasks);
          }
          if (active) setDataOwner(user.id);
        } else {
          if (active) {
            setTasks(readLocalTasks());
            setDataOwner("local");
          }
        }
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : "Unable to load saved progress.");
          setTasks(readLocalTasks());
          setDataOwner("local");
        }
      }
    }

    void loadTasks();
    return () => {
      active = false;
    };
  }, [authReady, user]);

  useEffect(() => {
    if (!dataOwner) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    if (user && dataOwner === user.id) void saveTasks(user.id, tasks);
  }, [dataOwner, tasks, user]);

  function readLocalTasks(): Task[] {
    try {
      const savedTasks = window.localStorage.getItem(STORAGE_KEY);
      if (!savedTasks) return DEMO_TASKS;
      const parsed = JSON.parse(savedTasks) as unknown;
      return Array.isArray(parsed) ? (parsed as Task[]) : DEMO_TASKS;
    } catch {
      return DEMO_TASKS;
    }
  }

  async function saveTasks(userId: string, nextTasks: Task[]) {
    const { error } = await supabase.from("tasks").upsert(
      nextTasks.map((task) => ({
        user_id: userId,
        id: task.id,
        name: task.name,
        progress: task.progress,
      })),
      { onConflict: "user_id,id" },
    );
    if (error) setAuthError(error.message);
  }

  async function signInWithGitHub() {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) setAuthError(error.message);
  }

  async function signOut() {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
  }

  const average = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round(tasks.reduce((total, task) => total + task.progress, 0) / tasks.length);
  }, [tasks]);

  const completed = tasks.filter((task) => task.progress === 100).length;

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = taskName.trim();
    if (!name) return;
    setTasks((current) => [
      { id: crypto.randomUUID(), name, progress: 0 },
      ...current,
    ]);
    setTaskName("");
  }

  function adjustTask(id: string, amount: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, progress: Math.min(100, Math.max(0, task.progress + amount)) }
          : task,
      ),
    );
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="moving-grid pointer-events-none fixed inset-0" aria-hidden="true" />

      <header className="relative z-10 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center">
              <S141Logo className="size-8" />
            </span>
            <span className="font-display text-lg font-semibold text-foreground">Progress Report</span>
          </div>
          <div className="flex items-center gap-3">
            {!isSupabaseConfigured ? (
              <div className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:flex">
                <span className="size-1.5 rounded-full bg-success pulse-dot" />
                Saved on this device
              </div>
            ) : user ? (
              <>
                <span className="hidden max-w-40 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:inline">
                  {user.email}
                </span>
                <Button type="button" variant="ghost" size="smallIcon" onClick={signOut} aria-label="Sign out" title="Sign out">
                  <LogOut className="size-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={signInWithGitHub}>
                <LogIn className="size-4" aria-hidden="true" />
                Sign in with GitHub
              </Button>
            )}
          </div>
        </div>
      </header>

      {authError && (
        <div className="relative z-10 border-b border-destructive/30 bg-destructive/10 px-5 py-2 text-center text-xs text-destructive">
          {authError}
        </div>
      )}

      <main className="relative z-10 mx-auto max-w-4xl px-5 pb-24 pt-12 sm:pt-16">
        <section className="mb-10 animate-fade-in">
          <h1 className="mx-auto max-w-2xl text-center font-display text-4xl font-semibold leading-[1.05] text-foreground sm:text-5xl">
            Welcome back, Operator
          </h1>
        </section>

        <form
          onSubmit={addTask}
          className="mb-5 flex flex-col gap-3 rounded-lg border border-border-strong bg-surface-elevated p-3 shadow-elevated sm:flex-row"
        >
          <label htmlFor="task-name" className="sr-only">
            Task name
          </label>
          <input
            id="task-name"
            value={taskName}
            onChange={(event) => setTaskName(event.target.value)}
            maxLength={80}
            placeholder="What are you making progress on?"
            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-surface px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" disabled={!taskName.trim()}>
            <Plus className="size-4" aria-hidden="true" />
            Add tracker
          </Button>
        </form>

        <section className="mb-5 grid grid-cols-3 border-y border-border bg-background/60 py-5 backdrop-blur-sm">
          <Stat label="Trackers" value={tasks.length} />
          <Stat label="Average" value={`${average}%`} bordered />
          <Stat label="Complete" value={completed} />
        </section>

        <div className="space-y-3" aria-live="polite">
          {tasks.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-border-strong bg-surface/60 px-6 text-center">
              <Target className="mb-4 size-7 text-primary" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-foreground">Your next goal starts here</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Name a task above to create its progress tracker.
              </p>
            </div>
          ) : (
            tasks.map((task, index) => (
              <TaskTracker
                key={task.id}
                task={task}
                index={index}
                onAdjust={adjustTask}
                onRemove={removeTask}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, bordered = false }: { label: string; value: number | string; bordered?: boolean }) {
  return (
    <div className={bordered ? "border-x border-border px-4 text-center" : "px-4 text-center"}>
      <div className="font-display text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function TaskTracker({
  task,
  index,
  onAdjust,
  onRemove,
}: {
  task: Task;
  index: number;
  onAdjust: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
}) {
  const [step, setStep] = useState("5");

  const parsedStep = Math.floor(Number(step));
  const safeStep = Number.isFinite(parsedStep) ? Math.min(100, Math.max(1, parsedStep)) : 1;
  const stepLabel = `${safeStep}%`;

  function handleStepChange(value: string) {
    // Allow typing freely; clamp only when it is a usable number.
    if (value === "" || /^\d+$/.test(value)) setStep(value);
  }

  function commitStep() {
    setStep(String(safeStep));
  }

  return (
    <article className="tracker-card animate-fade-in border border-border-strong bg-surface-elevated p-4 shadow-card sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Tracker {String(index + 1).padStart(2, "0")}
          </div>
          <h2 className="break-words font-display text-lg font-semibold text-foreground">{task.name}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="smallIcon"
          onClick={() => onRemove(task.id)}
          aria-label={`Delete ${task.name}`}
          title="Delete tracker"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-end justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Progress</span>
          <span className="font-display text-3xl font-semibold tabular-nums text-foreground">{task.progress}%</span>
        </div>
        <div
          className="progress-track h-4 overflow-hidden rounded-sm border border-border bg-muted"
          role="progressbar"
          aria-label={`${task.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={task.progress}
        >
          <div
            className="progress-fill h-full rounded-[2px]"
            style={{
              width: `${task.progress}%`,
              "--progress-hue": `${Math.round(task.progress * 1.4)}`,
            } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <label
          htmlFor={`step-${task.id}`}
          className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
        >
          Step
          <input
            id={`step-${task.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={step}
            onChange={(event) => handleStepChange(event.target.value)}
            onBlur={commitStep}
            aria-label={`Adjustment amount for ${task.name}, in percent`}
            className="h-8 w-14 rounded-md border border-input bg-surface px-2 text-center font-mono text-xs tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onAdjust(task.id, -safeStep)}
            disabled={task.progress === 0}
            aria-label={`Decrease ${task.name} progress by ${stepLabel}`}
            title={`Decrease by ${stepLabel}`}
          >
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onAdjust(task.id, safeStep)}
            disabled={task.progress === 100}
            aria-label={`Increase ${task.name} progress by ${stepLabel}`}
            title={`Increase by ${stepLabel}`}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}