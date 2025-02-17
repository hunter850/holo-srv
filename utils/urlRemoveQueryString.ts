function urlRemoveQueryString(fullUrl: string) {
    const url = new URL(fullUrl);
    const origin = url.origin;
    const pathname = url.pathname;
    return `${origin}${pathname}`;
}

export default urlRemoveQueryString;
