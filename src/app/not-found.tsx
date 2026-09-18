import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Niet gevonden</h1>
      <p className="text-sm opacity-80">
        Deze pagina of kaart bestaat niet (meer).
      </p>
      <Link href="/" className="text-sm underline underline-offset-4">
        Terug naar het overzicht
      </Link>
    </div>
  );
}
