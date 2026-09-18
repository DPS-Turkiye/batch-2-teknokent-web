"use client";

import Image from "next/image";
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
    <section
      aria-labelledby="meeting-todos-title"
      className="relative flex h-full min-h-[36rem] flex-col overflow-hidden rounded-[24px] bg-white py-6 pl-9 pr-6 shadow-[4px_-4px_0_#d4d8dd,8px_-8px_0_#a8a8a8]"
    >
      {[80, 212].map((top) => (
        <Image
          key={top}
          src="/startup/notebook-binding.svg"
          alt=""
          width={34}
          height={112}
          className="absolute -left-3 hidden sm:block"
          style={{ top }}
        />
      ))}
      <h2
        id="meeting-todos-title"
        className="shrink-0 border-b border-[#c2c2c2] p-3 text-xl leading-7 text-[#22262b]"
      >
        Yapılacaklar
      </h2>

      {todosQuery.isLoading ? (
        <p className="p-3 text-sm text-[#8a8a8a]">Liste yükleniyor…</p>
      ) : todosQuery.isError ? (
        <p className="p-3 text-sm text-[#9b2c2c]">Liste şu an açılamıyor.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ul>
            {todos.map((todo) => (
              <li key={todo.id} className="group border-b border-[#c2c2c2] p-3">
                <label className="flex items-center gap-2 text-base leading-6 text-[#636e7d]">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={(event) =>
                      updateTodo.mutate({
                        todoId: todo.id,
                        done: event.target.checked,
                      })
                    }
                    className="size-[18px] shrink-0 accent-[#e86f22]"
                  />
                  <span
                    className={`min-w-0 flex-1 ${todo.done ? "line-through" : ""}`}
                  >
                    {todo.title}
                  </span>
                  <button
                    type="button"
                    aria-label="Maddeyi sil"
                    onClick={() => deleteTodo.mutate(todo.id)}
                    className="shrink-0 rounded p-1 text-[#c2c2c2] opacity-0 hover:text-[#9b2c2c] group-hover:opacity-100"
                  >
                    <Trash2
                      className="size-3.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </button>
                </label>
              </li>
            ))}
          </ul>
          <form onSubmit={addTodo} className="border-b border-[#c2c2c2] p-3">
            <label className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-[18px] shrink-0 rounded border border-[#d4d8dd]"
              />
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Görev ekle"
                aria-label="Görev ekle"
                disabled={createTodo.isPending}
                className="min-w-0 flex-1 bg-transparent text-base leading-6 text-[#636e7d] outline-none placeholder:text-[#aeb4bc]"
              />
            </label>
          </form>
        </div>
      )}
    </section>
  );
}
