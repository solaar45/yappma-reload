/**
 * Runtime configuration utility
 * Supports reading from window.APP_CONFIG (generated at runtime in Docker)
 * with fallbacks to import.meta.env (standard Vite build/dev environment)
 */

interface AppConfig {
    VITE_API_BASE_URL: string;
    VITE_LOGOKIT_TOKEN: string;
    VITE_LOGO_DEV_TOKEN: string;
    [key: string]: string | undefined;
}

declare global {
    interface Window {
        APP_CONFIG?: Partial<AppConfig>;
    }
}

const getRuntimeConfig = (): AppConfig => {
    const runtimeConfig = window.APP_CONFIG || {};

    if (window.APP_CONFIG) {
        console.info('[Config] Runtime configuration detected');
    } else {
        console.warn('[Config] No runtime configuration found, using defaults/build-time envs');
    }

    return {
        VITE_API_BASE_URL: runtimeConfig.VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE_URL ?? '/api',
        VITE_LOGOKIT_TOKEN: runtimeConfig.VITE_LOGOKIT_TOKEN ?? import.meta.env.VITE_LOGOKIT_TOKEN ?? '',
        VITE_LOGO_DEV_TOKEN: runtimeConfig.VITE_LOGO_DEV_TOKEN ?? import.meta.env.VITE_LOGO_DEV_TOKEN ?? '',
    };
};

export const config = getRuntimeConfig();
export default config;
