import { createDb } from "../src/lib/db";
import { fetchMatches } from "../src/lib/footballData";
import { ingestMatches } from "../src/lib/ingest";

const token = process.env.FOOTBALL_DATA_TOKEN;
if (!token) { console.error("Zet FOOTBALL_DATA_TOKEN (gratis sleutel via football-data.org)."); process.exit(1); }
const db = await createDb(process.env.DATA_DIR ?? ".data/pg");
const rows = await fetchMatches(token, process.argv[2]);
console.log(await ingestMatches(db, rows));
