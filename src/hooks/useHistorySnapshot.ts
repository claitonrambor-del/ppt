import { debounce, throttle} from 'lodash'
import { useSnapshotStore } from '@/store'

export default () => {
  const snapshotStore = useSnapshotStore()

  // adicionarhistóricosnapshot(históricoregistro)
  const addHistorySnapshot = debounce(function() {
    snapshotStore.addSnapshot()
  }, 300, { trailing: true })

  // refazer
  const redo = throttle(function() {
    snapshotStore.reDo()
  }, 100, { leading: true, trailing: false })

  // desfazer
  const undo = throttle(function() {
    snapshotStore.unDo()
  }, 100, { leading: true, trailing: false })

  return {
    addHistorySnapshot,
    redo,
    undo,
  }
}