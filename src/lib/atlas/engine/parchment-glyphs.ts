import ancientColumns from '../../../../data/media/icons/game-icons/ancient-columns.svg?raw'
import castle from '../../../../data/media/icons/game-icons/castle.svg?raw'
import caveEntrance from '../../../../data/media/icons/game-icons/cave-entrance.svg?raw'
import coliseum from '../../../../data/media/icons/game-icons/coliseum.svg?raw'
import coral from '../../../../data/media/icons/game-icons/coral.svg?raw'
import crown from '../../../../data/media/icons/game-icons/crown.svg?raw'
import crystalBars from '../../../../data/media/icons/game-icons/crystal-bars.svg?raw'
import crystalCluster from '../../../../data/media/icons/game-icons/crystal-cluster.svg?raw'
import crystalGrowth from '../../../../data/media/icons/game-icons/crystal-growth.svg?raw'
import daisy from '../../../../data/media/icons/game-icons/daisy.svg?raw'
import desert from '../../../../data/media/icons/game-icons/desert.svg?raw'
import dinosaurBones from '../../../../data/media/icons/game-icons/dinosaur-bones.svg?raw'
import fallingRocks from '../../../../data/media/icons/game-icons/falling-rocks.svg?raw'
import floatingPlatforms from '../../../../data/media/icons/game-icons/floating-platforms.svg?raw'
import forest from '../../../../data/media/icons/game-icons/forest.svg?raw'
import frozenBlock from '../../../../data/media/icons/game-icons/frozen-block.svg?raw'
import grass from '../../../../data/media/icons/game-icons/grass.svg?raw'
import highGrass from '../../../../data/media/icons/game-icons/high-grass.svg?raw'
import hills from '../../../../data/media/icons/game-icons/hills.svg?raw'
import house from '../../../../data/media/icons/game-icons/house.svg?raw'
import island from '../../../../data/media/icons/game-icons/island.svg?raw'
import lava from '../../../../data/media/icons/game-icons/lava.svg?raw'
import lighthouse from '../../../../data/media/icons/game-icons/lighthouse.svg?raw'
import mining from '../../../../data/media/icons/game-icons/mining.svg?raw'
import mushrooms from '../../../../data/media/icons/game-icons/mushrooms.svg?raw'
import oak from '../../../../data/media/icons/game-icons/oak.svg?raw'
import palmTree from '../../../../data/media/icons/game-icons/palm-tree.svg?raw'
import peaks from '../../../../data/media/icons/game-icons/peaks.svg?raw'
import pineTree from '../../../../data/media/icons/game-icons/pine-tree.svg?raw'
import portal from '../../../../data/media/icons/game-icons/portal.svg?raw'
import shipWreck from '../../../../data/media/icons/game-icons/ship-wreck.svg?raw'
import swamp from '../../../../data/media/icons/game-icons/swamp.svg?raw'
import towerFlag from '../../../../data/media/icons/game-icons/tower-flag.svg?raw'
import treeRoots from '../../../../data/media/icons/game-icons/tree-roots.svg?raw'
import village from '../../../../data/media/icons/game-icons/village.svg?raw'
import volcano from '../../../../data/media/icons/game-icons/volcano.svg?raw'
import watchtower from '../../../../data/media/icons/game-icons/watchtower.svg?raw'
import wheat from '../../../../data/media/icons/game-icons/wheat.svg?raw'
import type { ParchmentGlyph } from '../contract/parchment.ts'

export const PARCHMENT_GLYPH_FILES = {
  coral,
  daisy,
  hills,
  peaks,
  wheat,
  forest,
  'pine-tree': pineTree,
  'palm-tree': palmTree,
  swamp,
  desert,
  'high-grass': highGrass,
  'falling-rocks': fallingRocks,
  grass,
  'frozen-block': frozenBlock,
  lava,
  'crystal-cluster': crystalCluster,
  mushrooms,
  house,
  crown,
  'tower-flag': towerFlag,
  village,
  oak,
  'ship-wreck': shipWreck,
  castle,
  coliseum,
  'floating-platforms': floatingPlatforms,
  island,
  volcano,
  'crystal-bars': crystalBars,
  'dinosaur-bones': dinosaurBones,
  lighthouse,
  portal,
  watchtower,
  'cave-entrance': caveEntrance,
  mining,
  'crystal-growth': crystalGrowth,
  'ancient-columns': ancientColumns,
  'tree-roots': treeRoots,
} satisfies Record<ParchmentGlyph, string>
