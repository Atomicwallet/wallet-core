import { HasBlockscannerMixin } from 'src/explorers/mixins';

import CosmosNodeExplorer from '../collection/CosmosNodeExplorer.js';

class CosmosNodeWithBlockscannerExplorer extends HasBlockscannerMixin(CosmosNodeExplorer) {}

export default CosmosNodeWithBlockscannerExplorer;
