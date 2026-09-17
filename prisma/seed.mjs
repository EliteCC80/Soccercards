import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cards = [
  {
    player: "Jude Bellingham",
    year: "2023-24",
    set: "Panini Prizm",
    variant: "Silver",
    isRookie: false,
    condition: "NM",
    priceLow: 2500,
    priceHigh: 4000,
    askingPrice: 3500,
    status: "LISTED",
  },
  {
    player: "Lamine Yamal",
    year: "2023-24",
    set: "Topps Chrome",
    variant: "Refractor",
    serialNumber: "38/50",
    isRookie: true,
    condition: "MINT",
    priceLow: 9000,
    priceHigh: 14000,
    askingPrice: 12500,
    status: "DRAFT",
  },
];

for (const card of cards) {
  const existing = await prisma.card.findFirst({
    where: { player: card.player, year: card.year, set: card.set },
  });
  if (!existing) await prisma.card.create({ data: card });
}

await prisma.$disconnect();
