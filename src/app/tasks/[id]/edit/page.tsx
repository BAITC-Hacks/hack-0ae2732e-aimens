"use client";
import { use } from "react";
import { TaskEditor } from "@/components/task-editor";
import { useDemo } from "@/components/demo-provider";
import { DataGate, Empty } from "@/components/ui";
export default function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data } = useDemo();
  const task = data?.tasks.find((task) => task.id === id);
  return (
    <DataGate>
      {task ? (
        <TaskEditor key={task.id} task={task} />
      ) : (
        <Empty
          title="Задача не найдена"
          text="Возможно, это неопубликованный черновик. Откройте его в режиме бизнеса."
          href="/"
        />
      )}
    </DataGate>
  );
}
