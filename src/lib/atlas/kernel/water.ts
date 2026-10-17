import type { Piece, RevealField } from '../contract/scene.ts'
import { type Grid, latticeX, latticeZ, SQRT3 } from '../world/grid.ts'
import type { World } from '../world/model.ts'
import { writeFlatHex } from './hex-mesh.ts'
import { MeshWriter, POSITIONS_ONLY } from './mesh.ts'
import { hexHidden, REVEAL_PAD } from './reveal.ts'
import { isAbyss } from './terrain.ts'

function waterLevel(world: World, tile: number): number {
  const lake = world.surface.lake[tile] ?? -1
  return lake >= 0 ? (world.lakes[lake]?.y ?? 0) : 0
}

function writeOpenSea(writer: MeshWriter, grid: Grid, reveal: RevealField): void {
  const rows = Math.ceil(REVEAL_PAD / 1.5) + 1
  const columns = Math.ceil(REVEAL_PAD / SQRT3) + 1
  for (let row = -rows; row < grid.rows + rows; row++) {
    for (let column = -columns; column < grid.columns + columns; column++) {
      if (row >= 0 && row < grid.rows && column >= 0 && column < grid.columns) continue
      const x = latticeX(column, row, grid.originX)
      const z = latticeZ(row, grid.originZ)
      if (!hexHidden(reveal, x, z)) writeFlatHex(writer, x, z, 0)
    }
  }
}

export function buildWater(world: World, grid: Grid, reveal: RevealField): Piece[] {
  const { water } = world.surface
  const shallow = new MeshWriter(POSITIONS_ONLY)
  const abyss = new MeshWriter(POSITIONS_ONLY)
  for (let tile = 0; tile < grid.size; tile++) {
    if (water[tile] !== 1) continue
    const x = grid.x[tile] ?? 0
    const z = grid.z[tile] ?? 0
    if (hexHidden(reveal, x, z)) continue
    writeFlatHex(isAbyss(world, grid, tile) ? abyss : shallow, x, z, waterLevel(world, tile))
  }
  writeOpenSea(abyss, grid, reveal)
  const pieces: Piece[] = []
  if (abyss.vertexCount > 0) pieces.push({ material: 'abyss', mesh: abyss.build(), casts: false })
  if (shallow.vertexCount > 0)
    pieces.push({ material: 'water', mesh: shallow.build(), casts: false })
  return pieces
}
