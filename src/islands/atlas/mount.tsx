import { createRoot } from 'react-dom/client'
import styles from '../../styles/atlas.css?inline'
import { AtlasApp } from './AtlasApp'
import { readAtlasBook } from './book'
import { AtlasClient } from './client'
import type { AtlasLaunch, AtlasMount } from './launch'
import { AtlasSound } from './sound'

export function mountAtlas(launch: AtlasLaunch): AtlasMount {
  const book = readAtlasBook(launch.section)
  const sheet = document.createElement('style')
  sheet.textContent = styles
  document.head.append(sheet)
  const client = new AtlasClient(launch)
  const sound = new AtlasSound()
  const root = createRoot(launch.root)
  root.render(
    <AtlasApp
      client={client}
      sound={sound}
      props={launch.props}
      book={book}
      world={launch.world}
      onSwitch={launch.switchWorld}
    />,
  )
  return {
    reveal: () => {
      client.reveal()
      sound.reveal()
    },
    suspend: () => {
      client.suspend()
      sound.suspend()
    },
    resume: () => {
      client.resume()
      sound.resume()
    },
    unmount: () => {
      root.unmount()
      sound.dispose()
      client.dispose()
      sheet.remove()
    },
  }
}
