import airballoon from '../../../data/media/icons/mdi/airballoon.svg?raw'
import bird from '../../../data/media/icons/mdi/bird.svg?raw'
import chevronDown from '../../../data/media/icons/mdi/chevron-down.svg?raw'
import chevronLeft from '../../../data/media/icons/mdi/chevron-left.svg?raw'
import chevronRight from '../../../data/media/icons/mdi/chevron-right.svg?raw'
import close from '../../../data/media/icons/mdi/close.svg?raw'
import cogOutline from '../../../data/media/icons/mdi/cog-outline.svg?raw'
import crosshairsGps from '../../../data/media/icons/mdi/crosshairs-gps.svg?raw'
import cubeOutline from '../../../data/media/icons/mdi/cube-outline.svg?raw'
import grid from '../../../data/media/icons/mdi/grid.svg?raw'
import imageFilterCenterFocus from '../../../data/media/icons/mdi/image-filter-center-focus.svg?raw'
import layersOutline from '../../../data/media/icons/mdi/layers-outline.svg?raw'
import magnify from '../../../data/media/icons/mdi/magnify.svg?raw'
import mapLegend from '../../../data/media/icons/mdi/map-legend.svg?raw'
import mapMarkerOutline from '../../../data/media/icons/mdi/map-marker-outline.svg?raw'
import mapMarkerPath from '../../../data/media/icons/mdi/map-marker-path.svg?raw'
import mapOutline from '../../../data/media/icons/mdi/map-outline.svg?raw'
import minus from '../../../data/media/icons/mdi/minus.svg?raw'
import monitor from '../../../data/media/icons/mdi/monitor.svg?raw'
import plus from '../../../data/media/icons/mdi/plus.svg?raw'
import rayEndArrow from '../../../data/media/icons/mdi/ray-end-arrow.svg?raw'
import rayStartArrow from '../../../data/media/icons/mdi/ray-start-arrow.svg?raw'
import rotate3dVariant from '../../../data/media/icons/mdi/rotate-3d-variant.svg?raw'
import sailBoat from '../../../data/media/icons/mdi/sail-boat.svg?raw'
import swapVertical from '../../../data/media/icons/mdi/swap-vertical.svg?raw'
import terrain from '../../../data/media/icons/mdi/terrain.svg?raw'
import train from '../../../data/media/icons/mdi/train.svg?raw'
import video2d from '../../../data/media/icons/mdi/video-2d.svg?raw'
import video3d from '../../../data/media/icons/mdi/video-3d.svg?raw'
import volumeHigh from '../../../data/media/icons/mdi/volume-high.svg?raw'
import volumeOff from '../../../data/media/icons/mdi/volume-off.svg?raw'
import walk from '../../../data/media/icons/mdi/walk.svg?raw'
import weatherSunset from '../../../data/media/icons/mdi/weather-sunset.svg?raw'
import { svgPath } from '../../lib/atlas/svg-path'

function pathOf(svg: string): string {
  return svgPath(svg).d
}

const ICONS = {
  airballoon: pathOf(airballoon),
  bird: pathOf(bird),
  'chevron-down': pathOf(chevronDown),
  'chevron-left': pathOf(chevronLeft),
  'chevron-right': pathOf(chevronRight),
  close: pathOf(close),
  'cog-outline': pathOf(cogOutline),
  'crosshairs-gps': pathOf(crosshairsGps),
  'cube-outline': pathOf(cubeOutline),
  grid: pathOf(grid),
  'image-filter-center-focus': pathOf(imageFilterCenterFocus),
  'layers-outline': pathOf(layersOutline),
  magnify: pathOf(magnify),
  'map-legend': pathOf(mapLegend),
  'map-marker-outline': pathOf(mapMarkerOutline),
  'map-marker-path': pathOf(mapMarkerPath),
  'map-outline': pathOf(mapOutline),
  minus: pathOf(minus),
  monitor: pathOf(monitor),
  plus: pathOf(plus),
  'ray-end-arrow': pathOf(rayEndArrow),
  'ray-start-arrow': pathOf(rayStartArrow),
  'rotate-3d-variant': pathOf(rotate3dVariant),
  'sail-boat': pathOf(sailBoat),
  'swap-vertical': pathOf(swapVertical),
  terrain: pathOf(terrain),
  train: pathOf(train),
  'video-2d': pathOf(video2d),
  'video-3d': pathOf(video3d),
  'volume-high': pathOf(volumeHigh),
  'volume-off': pathOf(volumeOff),
  walk: pathOf(walk),
  'weather-sunset': pathOf(weatherSunset),
} satisfies Record<string, string>

export type IconName = keyof typeof ICONS

export function AtlasIcon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className ? `au-atlas-icon ${className}` : 'au-atlas-icon'}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={ICONS[name]} fill="currentColor" />
    </svg>
  )
}
