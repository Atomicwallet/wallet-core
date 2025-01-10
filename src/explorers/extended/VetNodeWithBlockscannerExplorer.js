import VetNodeExplorer from '../collection/VetNodeExplorer.js';
import { HasBlockscannerMixin } from '../mixins';

class VetNodeWithBlockscannerExplorer extends HasBlockscannerMixin(
  VetNodeExplorer,
) {}

export default VetNodeWithBlockscannerExplorer;
