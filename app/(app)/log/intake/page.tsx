import { ChatWindow } from "@/components/chat/ChatWindow";

export default function IntakeLogPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Log Intake</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Describe your meal and the AI will estimate the calories.
        </p>
      </div>
      <ChatWindow />
    </main>
  );
}
