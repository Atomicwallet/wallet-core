import { HasBlockscannerMixin } from 'src/explorers/mixins';

import TronNodeExplorer from '../collection/TronNodeExplorer.js';

class TronNodeWithBlockscannerExplorer extends HasBlockscannerMixin(TronNodeExplorer) {}

export default TronNodeWithBlockscannerExplorer;
