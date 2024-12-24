import { HasBlockscannerMixin } from '../mixins'
import BlockbookV2Explorer from '../collection/BlockbookV2Explorer.js'

class BlockbookV2WithBlockscannerExplorer extends HasBlockscannerMixin(BlockbookV2Explorer) {}

export default BlockbookV2WithBlockscannerExplorer
