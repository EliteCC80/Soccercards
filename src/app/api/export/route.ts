import { CardError, listCards } from "@/lib/cards";
import { cardsToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  let cards;
  try {
    cards = await listCards({
      status: params.get("status") ?? undefined,
      query: params.get("q") ?? undefined,
    });
  } catch (error) {
    if (error instanceof CardError) {
      return new Response(error.message, { status: 400 });
    }
    throw error;
  }

  const date = new Date().toISOString().slice(0, 10);

  return new Response(cardsToCsv(cards), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vinted-listing-tracker-${date}.csv"`,
    },
  });
}
