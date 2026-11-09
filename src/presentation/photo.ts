// Evidencia 1 — «Fotografía imposible». Texturas generadas por código (arte original, sin assets de
// terceros): anverso sepia de un umbral con una silueta apenas visible tras el marco; reverso con
// la inscripción y la marca del Observador. Es arte PROVISIONAL del Hito 1, a sustituir en el Hito 5.
import * as THREE from 'three'
import {PHOTO_EVIDENCE} from '../game/evidenceText'
import {COLOR, makeContactShadowTexture} from './sceneUtils'

export const PHOTO_WIDTH = 0.15
export const PHOTO_HEIGHT = 0.1
const PHOTO_DEPTH = 0.003
const TEX_W = 768
const TEX_H = 512

/** PRNG determinista: la textura sale idéntica en cada partida. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas2d(): [HTMLCanvasElement, CanvasRenderingContext2D | null] {
  const c = document.createElement('canvas')
  c.width = TEX_W
  c.height = TEX_H
  return [c, c.getContext('2d')]
}

function grain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number): void {
  const rnd = mulberry32(17)
  for (let i = 0; i < 9000; i++) {
    const v = rnd() > 0.5 ? 255 : 0
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`
    ctx.fillRect(x + rnd() * w, y + rnd() * h, 1.5, 1.5)
  }
}

/** La marca del Observador: ojo almendrado con una pupila vertical y tres trazos debajo. */
export function drawObserverMark(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = r * 0.09
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - r, cy)
  ctx.quadraticCurveTo(cx, cy - r * 0.95, cx + r, cy)
  ctx.quadraticCurveTo(cx, cy + r * 0.95, cx - r, cy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx, cy - r * 0.42)
  ctx.lineTo(cx, cy + r * 0.42)
  ctx.lineWidth = r * 0.16
  ctx.stroke()
  ctx.lineWidth = r * 0.07
  for (const dx of [-0.35, 0, 0.35]) {
    ctx.beginPath()
    ctx.moveTo(cx + dx * r, cy + r * 0.7)
    ctx.lineTo(cx + dx * r * 1.15, cy + r * 1.15)
    ctx.stroke()
  }
  ctx.restore()
}

function drawFront(): HTMLCanvasElement {
  const [c, ctx] = canvas2d()
  if (!ctx) return c
  const m = 28 // borde blanco
  ctx.fillStyle = '#e9e2d3'
  ctx.fillRect(0, 0, TEX_W, TEX_H)
  const iw = TEX_W - m * 2
  const ih = TEX_H - m * 2 - 40

  ctx.save()
  ctx.beginPath()
  ctx.rect(m, m, iw, ih)
  ctx.clip()
  // Pared y suelo sepia.
  const wall = ctx.createLinearGradient(0, m, 0, m + ih)
  wall.addColorStop(0, '#5b4632')
  wall.addColorStop(0.68, '#7a6046')
  wall.addColorStop(0.7, '#3e2f22')
  wall.addColorStop(1, '#5a4430')
  ctx.fillStyle = wall
  ctx.fillRect(m, m, iw, ih)
  // Umbral oscuro.
  const dx = m + iw * 0.52
  const dw = iw * 0.2
  const dTop = m + ih * 0.12
  const dBottom = m + ih * 0.7
  ctx.fillStyle = '#1d150f'
  ctx.fillRect(dx, dTop, dw, dBottom - dTop)
  // Silueta alta, apenas visible, medio oculta por el marco derecho.
  ctx.fillStyle = 'rgba(8,6,5,0.55)'
  const sx = dx + dw * 0.72
  ctx.beginPath()
  ctx.ellipse(sx, dTop + 46, 15, 21, 0.12, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(sx - 26, dTop + 74)
  ctx.quadraticCurveTo(sx - 30, dBottom - 40, sx - 20, dBottom)
  ctx.lineTo(sx + 34, dBottom)
  ctx.quadraticCurveTo(sx + 30, dTop + 120, sx + 22, dTop + 74)
  ctx.closePath()
  ctx.fill()
  // Marco de la puerta, que tapa parte de la silueta.
  ctx.fillStyle = '#6b523a'
  ctx.fillRect(dx - 10, dTop - 10, 10, dBottom - dTop + 10)
  ctx.fillRect(dx + dw, dTop - 10, 12, dBottom - dTop + 10)
  ctx.fillRect(dx - 10, dTop - 12, dw + 22, 12)
  // Fuga de luz y viñeta.
  const leak = ctx.createRadialGradient(m + iw * 0.15, m + ih * 0.2, 10, m + iw * 0.15, m + ih * 0.2, iw * 0.5)
  leak.addColorStop(0, 'rgba(255,214,160,0.28)')
  leak.addColorStop(1, 'rgba(255,214,160,0)')
  ctx.fillStyle = leak
  ctx.fillRect(m, m, iw, ih)
  const vig = ctx.createRadialGradient(m + iw / 2, m + ih / 2, ih * 0.3, m + iw / 2, m + ih / 2, iw * 0.65)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.6)')
  ctx.fillStyle = vig
  ctx.fillRect(m, m, iw, ih)
  grain(ctx, m, m, iw, ih, 0.18)
  ctx.restore()

  ctx.fillStyle = '#6e6658'
  ctx.font = '22px ui-monospace, Menlo, Consolas, monospace'
  ctx.textAlign = 'right'
  ctx.fillText(PHOTO_EVIDENCE.date, TEX_W - m, TEX_H - 22)
  return c
}

function drawBack(): HTMLCanvasElement {
  const [c, ctx] = canvas2d()
  if (!ctx) return c
  ctx.fillStyle = '#d9cfba'
  ctx.fillRect(0, 0, TEX_W, TEX_H)
  grain(ctx, 0, 0, TEX_W, TEX_H, 0.08)
  // Mancha de humedad.
  const stain = ctx.createRadialGradient(560, 140, 10, 560, 140, 170)
  stain.addColorStop(0, 'rgba(120,90,50,0.22)')
  stain.addColorStop(1, 'rgba(120,90,50,0)')
  ctx.fillStyle = stain
  ctx.fillRect(0, 0, TEX_W, TEX_H)
  // Sello del expediente.
  ctx.save()
  ctx.translate(140, 92)
  ctx.rotate(-0.12)
  ctx.strokeStyle = 'rgba(169,43,54,0.75)'
  ctx.lineWidth = 4
  ctx.strokeRect(-100, -30, 200, 60)
  ctx.fillStyle = 'rgba(169,43,54,0.8)'
  ctx.font = '600 26px ui-monospace, Menlo, Consolas, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('EXPEDIENTE 01', 0, 2)
  ctx.restore()
  // Inscripción manuscrita.
  ctx.fillStyle = '#2a211a'
  ctx.font = 'italic 46px "Snell Roundhand", "Segoe Script", "Bradley Hand", cursive'
  ctx.textAlign = 'center'
  ctx.fillText('No estaba vacía', TEX_W / 2, 250)
  ctx.fillText('cuando la tomé.', TEX_W / 2, 310)
  drawObserverMark(ctx, TEX_W / 2, 410, 48, '#2a211a')
  return c
}

function texture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export interface PhotoView {
  /** Pivote: en el mundo, su origen es el punto de apoyo; gira en Y. */
  root: THREE.Group
  /** Cuerpo de la foto (anverso en +Z local). */
  body: THREE.Mesh
  /** Volumen invisible más grande que la foto para facilitar el toque. */
  pickVolume: THREE.Mesh
  shadow: THREE.Mesh
  /** Plano oscuro tras la foto en modo examen (atenúa la cámara sin ocultar el entorno del todo). */
  backdrop: THREE.Mesh
}

export function createPhotoView(): PhotoView {
  const root = new THREE.Group()
  root.name = 'evidence-photo'

  const edge = new THREE.MeshStandardMaterial({color: 0xe9e2d3, roughness: 0.9})
  const front = new THREE.MeshStandardMaterial({map: texture(drawFront()), roughness: 0.55})
  const back = new THREE.MeshStandardMaterial({map: texture(drawBack()), roughness: 0.95})
  // Orden de caras de BoxGeometry: +X, -X, +Y, -Y, +Z (anverso), -Z (reverso).
  const body = new THREE.Mesh(new THREE.BoxGeometry(PHOTO_WIDTH, PHOTO_HEIGHT, PHOTO_DEPTH), [
    edge,
    edge,
    edge,
    edge,
    front,
    back,
  ])
  root.add(body)

  const pickVolume = new THREE.Mesh(
    new THREE.BoxGeometry(PHOTO_WIDTH * 1.8, PHOTO_HEIGHT * 1.8, 0.08),
    new THREE.MeshBasicMaterial({visible: false}),
  )
  body.add(pickVolume)

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(PHOTO_WIDTH * 1.5, PHOTO_WIDTH * 1.5),
    new THREE.MeshBasicMaterial({map: makeContactShadowTexture(), transparent: true, depthWrite: false}),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.001
  root.add(shadow)

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshBasicMaterial({color: COLOR.carbon, transparent: true, opacity: 0.72, depthTest: false, depthWrite: false}),
  )
  backdrop.renderOrder = 40
  backdrop.visible = false

  return {root, body, pickVolume, shadow, backdrop}
}

/**
 * overlay: la foto se dibuja encima de todo (en la mano o en examen), sin prueba de profundidad.
 * dimmed: posición del mundo dudosa (tracking no fiable).
 */
export function setPhotoAppearance(view: PhotoView, opts: {overlay: boolean; dimmed: boolean}): void {
  const materials = view.body.material as THREE.Material[]
  for (const m of materials) {
    m.transparent = opts.overlay || opts.dimmed
    m.opacity = opts.dimmed ? 0.35 : 1
    m.depthTest = !opts.overlay
    m.needsUpdate = true
  }
  view.body.renderOrder = opts.overlay ? 41 : 0
  view.shadow.visible = !opts.overlay
}
