import { ChatWindow } from "@/components/chat/ChatWindow";

export default function BurnLogPage() {
  return (
    <main className="flex min-h-[calc(100dvh-8rem)] flex-col p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Log Burn</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Describe your exercise and the AI will estimate calories burned.
        </p>
      </div>
      <ChatWindow mode="burn" />
    </main>
  );
}
