export default <T>(array: T[]): T | undefined => {
  if (!Array.isArray(array)) {
    throw new TypeError('Invalid Array');
  }

  const elem = Math.floor(Math.random() * array.length);

  return array[elem];
};
