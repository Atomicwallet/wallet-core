export default (_hex) => {
    let str = '';
    if (!_hex)
        return str;
    const hex = `${_hex}`;
    for (let index = 0; index < hex.length; index += 2) {
        str += String.fromCharCode(parseInt(hex.substr(index, 2), 16));
    }
    return str;
};
//# sourceMappingURL=hex2a.js.map