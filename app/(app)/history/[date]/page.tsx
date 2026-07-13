export default function HistoryDayPage({ params }: { params: { date: string } }) {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold">History — {params.date}</h1>
    </main>
  );
}
