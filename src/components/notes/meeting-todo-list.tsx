"use client";

import { Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import {
  useCreateMeetingTodo,
  useDeleteMeetingTodo,
  useMeetingTodos,
  useUpdateMeetingTodo,
} from "@/hooks/use-meeting-notes";

interface MeetingTodoListProps {
  meetingId: string;
}

export function MeetingTodoList({ meetingId }: MeetingTodoListProps) {
  const todosQuery = useMeetingTodos(meetingId);
  const createTodo = useCreateMeetingTodo(meetingId);
  const updateTodo = useUpdateMeetingTodo(meetingId);
  const deleteTodo = useDeleteMeetingTodo(meetingId);
  const [title, setTitle] = useState("");

  const todos = todosQuery.data ?? [];

  function addTodo(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || createTodo.isPending) return;
    createTodo.mutate(trimmed, { onSuccess: () => setTitle("") });
  }

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-4">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-[#171717]">Yapılacaklar</h2>
        <span className="text-xs text-[#8a8a8a]">
          {todos.filter((todo) => todo.done).length}/{todos.length} tamamlandı
        </span>
      </div>

      <form onSubmit={addTodo} className="mb-3 flex gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Yeni madde ekle"
          className="min-w-0 flex-1 rounded-md border border-[#e5e7eb] px-3 py-1.5 text-sm outline-none focus:border-[#4f39f6]"
        />
        <button
          type="submit"
          disabled={!title.trim() || createTodo.isPending}
          className="rounded-md border border-[#e5e7eb] px-3 py-1.5 text-xs font-medium text-[#364153] disabled:opacity-40"
        >
          Ekle
        </button>
      </form>

      {todosQuery.isLoading ? (
        <p className="text-sm text-[#8a8a8a]">Liste yükleniyor…</p>
      ) : todosQuery.isError ? (
        <p className="text-sm text-[#9b2c2c]">Liste şu an açılamıyor.</p>
      ) : todos.length === 0 ? (
        <p className="text-sm text-[#8a8a8a]">
          Bu toplantı için henüz madde eklenmedi.
        </p>
      ) : (
        <ul className="space-y-1">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-[#f9fafb]"
            >
              <input
                type="checkbox"
                checked={todo.done}
                onChange={(event) =>
                  updateTodo.mutate({
                    todoId: todo.id,
                    done: event.target.checked,
                  })
                }
                className="size-4 shrink-0 accent-[#4f39f6]"
              />
              <span
                className={`min-w-0 flex-1 text-sm ${
                  todo.done ? "text-[#99a1af] line-through" : "text-[#364153]"
                }`}
              >
                {todo.title}
              </span>
              {todo.createdByName ? (
                <span className="shrink-0 text-[10px] text-[#99a1af]">
                  {todo.createdByName}
                </span>
              ) : null}
              <button
                type="button"
                aria-label="Maddeyi sil"
                onClick={() => deleteTodo.mutate(todo.id)}
                className="shrink-0 rounded p-1 text-[#99a1af] hover:text-[#9b2c2c]"
              >
                <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
