const arrayToObject = (array, keyField) => {
  const arrayLength = array.length
  const obj = {}

  for (let index = 0; index < arrayLength; index += 1) {
    obj[array[index][keyField]] = array[index]
  }

  return obj
}

export default arrayToObject
