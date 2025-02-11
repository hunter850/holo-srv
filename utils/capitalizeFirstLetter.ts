function capitalizeFirstLetter(str: string) {
    if (str.length === 0) {
        return str;
    } else if (str.length === 1) {
        return str.toUpperCase();
    } else {
        return str[0].toUpperCase() + str.slice(1).toLowerCase();
    }
}

export default capitalizeFirstLetter;
