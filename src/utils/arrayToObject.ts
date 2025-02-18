const arrayToObject = <T extends Record<string, unknown>>(
  array: T[],
  keyField: keyof T,
): Record<string, T | undefined> => {
  const obj: Record<string, T | undefined> = {};

  for (let index = 0; index < array.length; index += 1) {
    const item = array[index];
    const key = item?.[keyField];
    if (key !== undefined && typeof key === 'string' && key !== '__proto__') {
      obj[key] = item;
    }
  }

  return obj;
};

export default arrayToObject;
