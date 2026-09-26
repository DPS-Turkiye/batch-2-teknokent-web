"use client";

import { Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  TodoBlankRows,
  TodoCheckbox,
  TodoNotebook,
} from "@/components/notes/todo-notebook";
import {
  useCreateMeetingTodo,
  useDeleteMeetingTodo,
  useMeetingTodoEditor,
  useMeetingTodos,
  useUpdateMeetingTodo,
} from "@/hooks/use-meeting-notes";
import { MeetingTodoSource } from "@/interfaces/meeting-note";
import { TODO_NOTEBOOK_LABELS as LABELS } from "@/lib/const/notes";

interface MeetingTodoListProps {
  meetingId: string;
}

export function MeetingTodoList({ meetingId }: MeetingTodoListProps) {
  const todosQuery = useMeetingTodos(meetingId);
  const createTodo = useCreateMeetingTodo(meetingId);
  const updateTodo = useUpdateMeetingTodo(meetingId);
  const deleteTodo = useDeleteMeetingTodo(meetingId);
  const editor = useMeetingTodoEditor(meetingId);
  const [title, setTitle] = useState("");

  const todos = todosQuery.data ?? [];

  function addTodo(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || createTodo.isPending) return;
    createTodo.mutate(trimmed, { onSuccess: () => setTitle("") });
  }

  return (
    <TodoNotebook titleId="meeting-todos-title" className="h-[389px]">
      {todosQuery.isLoading ? (
        <p className="p-3 text-sm text-[#8a8a8a]">{LABELS.loading}</p>
      ) : todosQuery.isError ? (
        <p className="p-3 text-sm text-[#9b2c2c]">{LABELS.error}</p>
      ) : (
        <>
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} className="group border-b border-[#c2c2c2] p-3">
                {editor.editingId === todo.id ? (
                  <div className="flex items-center gap-2">
                    <TodoCheckbox
                      checked={todo.done}
                      onChange={(done) =>
                        updateTodo.mutate({ todoId: todo.id, done })
                      }
                    />
                    <input
                      value={editor.draft}
                      onChange={(event) => editor.setDraft(event.target.value)}
                      onBlur={editor.save}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          editor.save();
                        } else if (event.key === "Escape") {
                          editor.cancel();
                        }
                      }}
                      aria-label={LABELS.editInput}
                      maxLength={1000}
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-base leading-6 text-[#22262b] outline-none"
                    />
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-base leading-6 text-[#636e7d]">
                    <TodoCheckbox
                      checked={todo.done}
                      onChange={(done) =>
                        updateTodo.mutate({ todoId: todo.id, done })
                      }
                    />
                    <span
                      className={`min-w-0 flex-1 break-words ${todo.done ? "line-through" : ""}`}
                    >
                      {todo.title}
                    </span>
                    {todo.source === MeetingTodoSource.Ai ? (
                      <span
                        title={LABELS.aiTagHint}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fff1e8] px-2 py-0.5 text-[11px] font-medium text-[#e86f22]"
                      >
                        <Sparkles className="size-3" aria-hidden />
                        {LABELS.aiTag}
                        <span className="sr-only"> · {LABELS.aiTagHint}</span>
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={LABELS.edit}
                      onClick={(event) => {
                        event.preventDefault();
                        editor.start(todo);
                      }}
                      className="shrink-0 rounded p-1 text-[#c2c2c2] opacity-0 hover:text-[#22262b] focus:opacity-100 group-hover:opacity-100"
                    >
                      <Pencil
                        className="size-3.5"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={LABELS.remove}
                      onClick={() => deleteTodo.mutate(todo.id)}
                      className="shrink-0 rounded p-1 text-[#c2c2c2] opacity-0 hover:text-[#9b2c2c] focus:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2
                        className="size-3.5"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </button>
                  </label>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={addTodo} className="border-b border-[#c2c2c2] p-3">
            <label className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-[18px] shrink-0 rounded-[4px] border border-[#d4d8dd]"
              />
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={LABELS.add}
                aria-label={LABELS.add}
                disabled={createTodo.isPending}
                className="min-w-0 flex-1 bg-transparent text-base leading-6 text-[#636e7d] outline-none placeholder:text-[#aeb4bc]"
              />
            </label>
          </form>
          <TodoBlankRows used={todos.length + 1} />
        </>
      )}
    </TodoNotebook>
  );
}
