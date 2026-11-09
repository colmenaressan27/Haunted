// Objeto de la prueba de anclaje (Hito 0): cubo estático con sombra de contacto falsa.
// Estático a propósito: cualquier movimiento visible al caminar es deriva del tracking, no animación.
import * as THREE from 'three'
import {COLOR, makeContactShadowTexture} from './sceneUtils'

export const TEST_CUBE_SIZE = 0.15

/** Grupo con origen en la base del cubo (y=0 = superficie donde se apoya). */
export function createTestCube(size: number = TEST_CUBE_SIZE): THREE.Group {
  const group = new THREE.Group()
  group.name = 'anchor-test-cube'

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshStandardMaterial({color: COLOR.amber, roughness: 0.55, metalness: 0.05}),
  )
  cube.position.y = size / 2
  group.add(cube)

  // Aristas para que la deriva sea fácil de ver contra el fondo real.
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cube.geometry),
    new THREE.LineBasicMaterial({color: COLOR.carbon}),
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
