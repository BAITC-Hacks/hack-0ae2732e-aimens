"use client";
import { TaskEditor } from "@/components/task-editor";
import { DataGate } from "@/components/ui";
export default function NewTaskPage() {
  return (
    <DataGate>
      <TaskEditor />
    </DataGate>
  );
}
