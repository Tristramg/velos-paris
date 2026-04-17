/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_MAPBOX_TOKEN: string;
	readonly PUBLIC_MAPBOX_CENTER: string;
	readonly PUBLIC_MAPBOX_ZOOM: string;
	readonly BASE_PATH: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
