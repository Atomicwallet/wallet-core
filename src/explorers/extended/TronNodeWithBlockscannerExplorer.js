import TronNodeExplorer from '../collection/TronNodeExplorer.js';
import { HasBlockscannerMixin } from '../mixins';

class TronNodeWithBlockscannerExplorer extends HasBlockscannerMixin(
  TronNodeExplorer,
) {}

export default TronNodeWithBlockscannerExplorer;
