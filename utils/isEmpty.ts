function isEmpty(value: any): boolean {
    if (value === null || value === undefined || value === 0) {
        return true;
    } else if (typeof value === "string") {
        return value.trim() === "";
    } else if (Array.isArray(value)) {
        return value.length === 0;
    } else if (Object.prototype.toString.apply(value) === "[object Object]") {
        return Object.keys(value as Record<string, any>).length === 0;
    } else {
        return false;
    }
}

export default isEmpty;
