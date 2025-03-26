import { HasBlockscannerMixin } from 'src/explorers/mixins';

import VetNodeExplorer from '../collection/VetNodeExplorer.js';

class VetNodeWithBlockscannerExplorer extends HasBlockscannerMixin(VetNodeExplorer) {}

export default VetNodeWithBlockscannerExplorer;
