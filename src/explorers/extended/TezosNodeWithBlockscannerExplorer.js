import TezosNodeExplorer from '../collection/TezosNodeExplorer.js';
import { HasBlockscannerMixin } from '../mixins';

class TezosNodeWithBlockscannerExplorer extends HasBlockscannerMixin(
  TezosNodeExplorer,
) {}

export default TezosNodeWithBlockscannerExplorer;
