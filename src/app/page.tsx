import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Kansinschattingen die je kunt narekenen</h1>
      <p className="max-w-2xl text-stone-700">
        Elke voorspelling wordt vóór de aftrap vastgelegd in een keten van hashes. Achteraf aanpassen of weghalen kan niet,
        dus ook de missers staan erin. We vergelijken onszelf met de slotkoersen van bookmakers.
      </p>
      <Link href="/trackrecord" className="inline-block rounded bg-stone-900 px-4 py-2 text-white">Bekijk het volledige trackrecord</Link>
    </div>
  );
}
