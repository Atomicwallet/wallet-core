import spark from 'spark-md5';
import type { TokenIdParts } from 'src/abstract';

export const getTokenId = ({ contract, parent, network, ticker }: TokenIdParts) =>
  spark.hash([ticker, contract, parent || network].map((field) => field?.toLowerCase()).join(''));
