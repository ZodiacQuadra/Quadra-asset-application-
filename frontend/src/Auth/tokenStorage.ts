const LOCAL_TOKEN = "local-development-token";
export const getStoredAuthToken = (): string => LOCAL_TOKEN;
export const setStoredAuthToken = (): void => undefined;
export const clearStoredAuthToken = (): void => undefined;
export const getStoredAuthTokenWithMetadata = () => ({ value: LOCAL_TOKEN, timestamp: Date.now() });
