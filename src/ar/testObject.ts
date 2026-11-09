// Objeto de prueba del Hito 0: cubo estático con sombra de contacto falsa (sin sombras en tiempo real).
// Estático a propósito: cualquier movimiento visible al caminar es deriva del tracking, no animación.
import * as THREE from 'three'

export const TEST_CUBE_SIZE = 0.15

function makeContactShadowTexture(): THREE.Texture {
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

/** Grupo con origen en la base del cubo (y=0 = superficie donde se apoya). */
export function createTestCube(size: number = TEST_CUBE_SIZE): THREE.Group {
  const group = new THREE.Group()
  group.name = 'hito0-test-cube'

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({color: 0xd8ac6b, roughness: 0.55, metalness: 0.05}),
  )
  cube.position.y = size / 2
  group.add(cube)

  // Aristas para que la deriva sea fácil de ver contra el fondo real.
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({color: 0x090d10}),
  )
  edges.position.copy(cube.position)
  group.add(edges)

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(size * 2.2, size * 2.2),
    new THREE.MeshBasicMaterial({map: makeContactShadowTexture(), transparent: true, depthWrite: false}),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.001
  group.add(shadow)

  return group
}

/** Atenúa el objeto mientras el tracking no es fiable: su posición puede no ser la real. */
export function setObjectDimmed(root: THREE.Object3D, dimmed: boolean): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of materials) {
        // Se guardan opacidad y transparencia originales (la sombra es transparente por textura).
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

export function addTestLights(scene: THREE.Scene): void {
  scene.add(new THREE.HemisphereLight(0xeee9e1, 0x242c31, 1.2))
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(1.5, 3, 1)
  scene.add(key)
}

export function createReticle(): THREE.Mesh {
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.065, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({color: 0xd8ac6b, transparent: true, opacity: 0.9, depthTest: false}),
  )
  reticle.renderOrder = 10
  reticle.visible = false
  return reticle
}

export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
      obj.geometry.dispose()
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of materials) {
        if ('map' in m && m.map instanceof THREE.Texture) m.map.dispose()
        m.dispose()
      }
    }
  })
}
