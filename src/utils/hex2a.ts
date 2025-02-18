export default (_hex: string | number) => {
  let str = '';

  if (!_hex) return str;

  const hex = `${_hex}`;

  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string: length must be even.');
  }

  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error('Invalid hex string: contains non-hex characters.');
  }

  for (let index = 0; index < hex.length; index += 2) {
    const byte = hex.substr(index, 2);
    const charCode = parseInt(byte, 16);

    if (charCode >= 32 && charCode <= 126) {
      str += String.fromCharCode(charCode);
    } else {
      str += '?';
    }
  }

  return str;
};
