const COOKIE_NAME = "dorada_device_doc";
const ONE_YEAR = 365 * 24 * 60 * 60;

export const deviceCookie = {
  get(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  set(value: string): void {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; max-age=${ONE_YEAR}; path=/; SameSite=Strict`;
  },
  clear(): void {
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
  },
};
