function sleep(sec?: number) {
    const sleepTime = sec ?? 1000;
    return new Promise<boolean>((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, sleepTime);
    });
}

export default sleep;
