import { list, del } from "@vercel/blob"

const DRY_RUN = process.argv.includes("--dry-run")
const cutoff = new Date()
cutoff.setMonth(cutoff.getMonth() - 3)

async function listAll() {
  const blobs = []
  let cursor
  do {
    const page = await list({ cursor, limit: 1000 })
    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return blobs
}

const blobs = await listAll()
const old = blobs.filter((b) => new Date(b.uploadedAt) < cutoff)
const recent = blobs.length - old.length
const oldBytes = old.reduce((sum, b) => sum + b.size, 0)

console.log(`Fecha de corte: ${cutoff.toISOString().slice(0, 10)}`)
console.log(`Total de archivos: ${blobs.length}`)
console.log(`Recientes (se conservan): ${recent}`)
console.log(`Antiguos (a eliminar): ${old.length} — ${(oldBytes / 1024 / 1024).toFixed(1)} MB`)

const iso = (d) => new Date(d).toISOString()
const byMonth = {}
for (const b of old) {
  const key = iso(b.uploadedAt).slice(0, 7)
  byMonth[key] = (byMonth[key] || 0) + 1
}
console.log("Por mes:", byMonth)

if (DRY_RUN) {
  console.log("\nDRY RUN: no se eliminó nada. Ejemplos:")
  for (const b of old.slice(0, 10)) console.log(` - ${b.pathname} (${iso(b.uploadedAt).slice(0, 10)})`)
  process.exit(0)
}

const BATCH = 100
for (let i = 0; i < old.length; i += BATCH) {
  const batch = old.slice(i, i + BATCH)
  await del(batch.map((b) => b.url))
  console.log(`Eliminados ${Math.min(i + BATCH, old.length)}/${old.length}`)
}
console.log("Limpieza completada.")
