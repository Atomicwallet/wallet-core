import { HasBlockscannerMixin } from '../mixins'
import TezosNodeExplorer from '../collection/TezosNodeExplorer.js'

class TezosNodeWithBlockscannerExplorer extends HasBlockscannerMixin(TezosNodeExplorer) {}

export default TezosNodeWithBlockscannerExplorer
