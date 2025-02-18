const getRandomElement = (array) => {
    if (!Array.isArray(array)) {
        throw new TypeError('Invalid Array');
    }
    const index = Math.floor(Math.random() * array.length);
    return array[index];
};
export default getRandomElement;
//# sourceMappingURL=randomElementFromArray.js.map