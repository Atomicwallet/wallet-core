import { HasBlockscannerMixin } from '../mixins'
import CosmosNodeExplorer from '../collection/CosmosNodeExplorer.js'

class CosmosNodeWithBlockscannerExplorer extends HasBlockscannerMixin(CosmosNodeExplorer) {}

export default CosmosNodeWithBlockscannerExplorer
