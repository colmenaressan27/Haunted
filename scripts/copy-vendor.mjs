// Copia, SIN MODIFICAR, los artefactos distribuidos de 8th Wall a public/external/.
// - @8thwall/engine-binary/dist -> public/external/xr        (licencia XR Engine, Niantic Spatial; solo forma original)
// - @8thwall/xrextras/dist      -> public/external/xrextras  (MIT)
// Así el runtime se sirve desde nuestro propio origen con versión exacta fijada en package-lock.json,
// sin depender de una CDN con versión flotante durante el stand.
import {cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outRoot = join(root, 'public', 'external')
const stampFile = join(outRoot, '.vendor.json')

const packages = [
  {name: '@8thwall/engine-binary', target: 'xr'},
  {name: '@8thwall/xrextras', target: 'xrextras'},
]

const resolved = packages.map((pkg) => {
  const pkgDir = join(root, 'node_modules', ...pkg.name.split('/'))
  const manifestPath = join(pkgDir, 'package.json')
  if (!existsSync(manifestPath)) {
    console.error(`[vendor] Falta ${pkg.name}. Ejecuta "npm install" primero.`)
    process.exit(1)
  }
  const {version} = JSON.parse(readFileSync(manifestPath, 'utf8'))
  return {...pkg, version, src: join(pkgDir, 'dist'), dest: join(outRoot, pkg.target)}
})

const stamp = JSON.stringify(Object.fromEntries(resolved.map((p) => [p.name, p.version])), null, 2)
const upToDate =
  existsSync(stampFile) &&
  readFileSync(stampFile, 'utf8') === stamp &&
  resolved.every((p) => existsSync(p.dest))

if (upToDate) {
  console.log('[vendor] Runtime 8th Wall ya copiado:', resolved.map((p) => `${p.name}@${p.version}`).join(', '))
} else {
  for (const p of resolved) {
    rmSync(p.dest, {recursive: true, force: true})
    mkdirSync(p.dest, {recursive: true})
    cpSync(p.src, p.dest, {recursive: true})
    console.log(`[vendor] ${p.name}@${p.version} -> public/external/${p.target}`)
  }
  writeFileSync(stampFile, stamp)
}
