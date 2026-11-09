// Utilidades Three.js compartidas por los controladores de sesión (presentación, no lógica de juego).
import * as THREE from 'three'

export const COLOR = {
  bone: 0xeee9e1,
  slate: 0x242c31,
  carbon: 0x090d10,
  amber: 0xd8ac6b,
  teal: 0x7199a0,
  hostile: 0xa92b36,
} as const

export function makeContactShadowTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(0,0,0,0.55)')
    g.addColorStop(0.6, 'rgba(0,0,0,0.2)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  return new THREE.CanvasTexture(canvas)
}

/** Atenúa el objeto mientras el tracking no es fiable: su posición puede no ser la real. */
export function setObjectDimmed(root: THREE.Object3D, dimmed: boolean): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Sprite) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of materials) {
        // Se guardan opacidad y transparencia originales (p. ej. la sombra es transparente por textura).
        const ud = m.userData as {baseOpacity?: number; baseTransparent?: boolean}
        const baseOpacity = (ud.baseOpacity ??= m.opacity)
        const baseTransparent = (ud.baseTransparent ??= m.transparent)
        m.transparent = dimmed || baseTransparent
        m.opacity = dimmed ? baseOpacity * 0.3 : baseOpacity
        m.needsUpdate = true
      }
    }
  })
}

export function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(COLOR.bone, COLOR.slate, 1.2))
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(1.5, 3, 1)
  scene.add(key)
}

export function createReticle(): THREE.Mesh {
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.065, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({color: COLOR.amber, transparent: true, opacity: 0.9, depthTest: false}),
  )
  reticle.renderOrder = 10
  reticle.visible = false
  return reticle
}

export function setReticleColor(reticle: THREE.Mesh, color: number): void {
  const mat = reticle.material as THREE.MeshBasicMaterial
  mat.color.setHex(color)
}

/** Etiqueta de texto que siempre mira a la cámara. `height` en unidades de escena. */
export function createLabel(text: string, color: string, height = 0.07): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const font = '600 44px ui-monospace, Menlo, Consolas, monospace'
  let width = 256
  if (ctx) {
    ctx.font = font
    width = Math.ceil(ctx.measureText(text).width) + 40
  }
  canvas.width = width
  canvas.height = 72
  if (ctx) {
    ctx.font = font
    ctx.fillStyle = 'rgba(9,13,16,0.78)'
    ctx.beginPath()
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16)
    ctx.fill()
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 20, canvas.height / 2 + 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, transparent: true, depthTest: false}))
  sprite.scale.set((height * canvas.width) / canvas.height, height, 1)
  sprite.renderOrder = 20
  return sprite
}

export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) obj.geometry.dispose()
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Sprite) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of materials) {
        if ('map' in m && m.map instanceof THREE.Texture) m.map.dispose()
        m.dispose()
      }
    }
  })
}

/** Coloca `obj` relativo a la cámara (offset y giro locales) sin necesitar que la cámara esté en la escena. */
export function placeRelativeToCamera(
  obj: THREE.Object3D,
  camera: THREE.Camera,
  localOffset: THREE.Vector3,
  localRotation: THREE.Quaternion,
): void {
  obj.position.copy(localOffset).applyQuaternion(camera.quaternion).add(camera.position)
  obj.quaternion.copy(camera.quaternion).multiply(localRotation)
}
