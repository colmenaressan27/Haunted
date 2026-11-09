// Marcadores visibles de las zonas calibradas. Son guías del jugador, no geometría real detectada:
// el umbral es un rectángulo orientativo, NO un oclusor (la oclusión calibrada llega en el Hito 2).
import * as THREE from 'three'
import type {ZoneKind} from '../game/calibration'
import {COLOR, createLabel} from './sceneUtils'

const LABELS: Record<ZoneKind, {text: string; color: string; hex: number}> = {
  safe: {text: 'ZONA SEGURA', color: '#7199A0', hex: COLOR.teal},
  table: {text: 'MESA', color: '#D8AC6B', hex: COLOR.amber},
  peek: {text: 'UMBRAL', color: '#E07A84', hex: COLOR.hostile},
}

function flatRing(inner: number, outer: number, color: number, opacity: number): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide}),
  )
  mesh.position.y = 0.002
  return mesh
}

/** Crea el marcador de una zona. `faceYaw` orienta el umbral hacia el jugador al marcarlo. */
export function createZoneMarker(kind: ZoneKind, faceYaw = 0): THREE.Group {
  const group = new THREE.Group()
  group.name = `zone-${kind}`
  const {text, color, hex} = LABELS[kind]

  if (kind === 'safe') {
    group.add(flatRing(0.28, 0.32, hex, 0.9))
    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(0.28, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({color: hex, transparent: true, opacity: 0.12, depthWrite: false}),
    )
    fill.position.y = 0.001
    group.add(fill)
    const label = createLabel(text, color)
    label.position.y = 0.2
    group.add(label)
  } else if (kind === 'table') {
    group.add(flatRing(0.1, 0.12, hex, 0.9))
    const label = createLabel(text, color, 0.05)
    label.position.y = 0.14
    group.add(label)
  } else {
    // Rectángulo vertical aproximado de puerta (0,8 × 1,9 u) con base en el punto marcado.
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.8, 1.9)),
      new THREE.LineBasicMaterial({color: hex, transparent: true, opacity: 0.85}),
    )
    frame.position.y = 0.95
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 1.9),
      new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.07,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    fill.position.y = 0.95
    const frameGroup = new THREE.Group()
    frameGroup.add(frame, fill)
    frameGroup.rotation.y = faceYaw
    group.add(frameGroup, flatRing(0.12, 0.15, hex, 0.9))
    const label = createLabel(text, color)
    label.position.y = 2.05
    group.add(label)
  }
  return group
}
