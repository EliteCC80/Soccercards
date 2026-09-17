import { listCards } from "@/lib/cards";
import { cardsToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cards = await listCards({
    status: params.get("status") ?? undefined,
    query: params.get("q") ?? undefined,
  });
  const date = new Date().toISOString().slice(0, 10);

  return new Response(cardsToCsv(cards), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vinted-listing-tracker-${date}.csv"`,
    },
  });
}
