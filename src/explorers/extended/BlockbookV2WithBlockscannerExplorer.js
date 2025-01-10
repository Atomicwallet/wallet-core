import BlockbookV2Explorer from '../collection/BlockbookV2Explorer.js';
import { HasBlockscannerMixin } from '../mixins';

class BlockbookV2WithBlockscannerExplorer extends HasBlockscannerMixin(
  BlockbookV2Explorer,
) {}

export default BlockbookV2WithBlockscannerExplorer;
