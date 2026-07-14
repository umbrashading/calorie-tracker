import { ChatWindow } from "@/components/chat/ChatWindow";

export default function IntakeLogPage() {
  return (
    <main className="flex min-h-[calc(100dvh-8rem)] flex-col p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Log Intake</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Describe your meal or attach a photo — the AI will estimate the calories.
        </p>
      </div>
      <ChatWindow mode="intake" />
    </main>
  );
}
