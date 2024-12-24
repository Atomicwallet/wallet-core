const hashCode = (string) => {
  let high = 0xDEADBEE

  for (let index = 0; index < string.length; index += 1) {
    high = 0xDEADBEE
    // eslint-disable-next-line no-bitwise
    high = Math.imul(high ^ string.charCodeAt(index), 2654435761)
  }

  // eslint-disable-next-line no-bitwise
  const sanitized = (high ^ (high >>> 16)) >>> 0

  return sanitized.toString()
}

export default hashCode
