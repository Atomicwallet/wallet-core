const arrayToObject = (array, keyField) => {
    const obj = {};
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
//# sourceMappingURL=arrayToObject.js.map