function uniqBy<T>(arr: T[], iteratee: ((...args: any[]) => any) | string) {
    if (typeof iteratee === "string") {
        const prop = iteratee;
        iteratee = (item) => item[prop];
    }

    return arr.filter((x, i, self) => i === self.findIndex((y) => iteratee(x) === iteratee(y)));
}

export default uniqBy;
