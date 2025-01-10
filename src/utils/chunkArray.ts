const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];
  const maxLength = array.length;

  for (let item = 0; item < maxLength; item += chunkSize) {
    result.push(array.slice(item, item + chunkSize));
  }

  return result;
};

export default chunkArray;
