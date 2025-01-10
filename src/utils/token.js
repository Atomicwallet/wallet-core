import spark from 'spark-md5';
export const getTokenId = ({ contract, parent, network, ticker }) =>
  spark.hash([ticker, contract, parent || network].map((field) => field?.toLowerCase()).join(''));
