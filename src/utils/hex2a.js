const hex2a = (hexx) => {
  let str = ''

  if (hexx) {
    const hex = `${hexx}`

    for (let index = 0; index < hex.length; index += 2) {
      str += String.fromCharCode(parseInt(hex.substr(index, 2), 16))
    }
  }

  return str
}

export default hex2a
