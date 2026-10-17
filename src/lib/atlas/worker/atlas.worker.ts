import { type FromWorker, isToWorker } from '../contract/protocol.ts'
import { AtlasSession } from './session.ts'

const send = (message: FromWorker, transfer: Transferable[] = []) =>
  postMessage(message, { transfer })

const session = new AtlasSession(send)

const failed = (error: unknown) =>
  send({ kind: 'failure', message: error instanceof Error ? error.message : String(error) })

addEventListener('message', (event: MessageEvent<unknown>) => {
  const message = event.data
  if (!isToWorker(message)) return
  switch (message.kind) {
    case 'start':
      session.start(message.locale, message.tier, message.world).catch(failed)
      return
    case 'tier':
      session.retier(message.tier, message.generation)
      return
    case 'focus':
      session.refocus(message.x, message.z)
      return
    case 'level':
      session.prioritiseLevel(message.level)
      return
    case 'travel':
      session.travel(message.id, message.request)
      return
  }
})
