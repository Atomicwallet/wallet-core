import CosmosNodeExplorer from '../collection/CosmosNodeExplorer.js';
import { HasBlockscannerMixin } from '../mixins';

class CosmosNodeWithBlockscannerExplorer extends HasBlockscannerMixin(
  CosmosNodeExplorer,
) {}

export default CosmosNodeWithBlockscannerExplorer;
