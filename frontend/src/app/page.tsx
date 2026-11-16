const features = [
  { bn: "সব আবেদন এক বোর্ডে", en: "Kanban pipeline for BCS, bank, govt & private jobs" },
  { bn: "সার্কুলারের ছবি দিন, AI তথ্য বের করবে", en: "AI circular capture: deadline, fee, age limit, posts" },
  { bn: "ডেডলাইন, পরীক্ষা ও ভাইভার রিমাইন্ডার", en: "Deadline, exam & viva reminders (push/SMS/email)" },
  { bn: "Teletalk-ready ছবি ও স্বাক্ষর ভল্ট", en: "Document vault with Teletalk photo/signature presets" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium text-emerald-700">ChakriTrack · v0.1 scaffold</p>
        <h1 className="text-4xl font-bold tracking-tight">চাকরির খোঁজ, গোছানো এক জায়গায়</h1>
        <p className="text-lg text-zinc-600">
          Job-application OS for Bangladeshi graduates. See <code>../PROJECT_SPEC.md</code> and{" "}
          <code>../AGENTS.md</code> for the build plan.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <li key={f.en} className="rounded-xl border border-zinc-200 p-4">
            <p className="font-semibold">{f.bn}</p>
            <p className="text-sm text-zinc-600">{f.en}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
