import { createBubble, createOverlay, Viewer } from '@my/gl/gis'

export function createBestViewingPoint(viewer: Viewer) {
  const HTMLElement1 = createBubble('1', '1')
  const HTMLElement2 = createBubble('2', '2')
  const HTMLElement3 = createBubble('3', '3')
  createOverlay(viewer, { x: 0.000263, y: 0.000084, z: 4 }, HTMLElement1)
  createOverlay(viewer, { x: 0.000377, y: -0.000019, z: 4 }, HTMLElement2)
  createOverlay(viewer, { x: 0.000497, y: -0.000125, z: 12 }, HTMLElement3)

  return {
    HTMLElement1,
    HTMLElement2,
    HTMLElement3,
  }
}
