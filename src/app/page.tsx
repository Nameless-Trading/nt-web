// app/page.tsx
import Markets from "@/components/Markets";

//temporary spaghetti code
async function getGameDays(): Promise<string[]> {
  const base =
    process.env.NEXT_PUBLIC_FASTAPI_HTTP ||
    process.env.FASTAPI_HTTP ||
    "http://localhost:8000";
  if (!base) throw new Error("FASTAPI base URL is not configured");
  const res = await fetch(`${base}/game-days`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load game days");
  return res.json();
}

export default async function Page() {
  const gameDays = await getGameDays();
  return (
    <div className="flex flex-col gap-4 max-w-screen px-4 py-4 lg:px-32">
      <Markets initialGameDays={gameDays} />
    </div>
  );
}
