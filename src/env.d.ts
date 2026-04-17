/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_MAPLIBRE_CENTER: string;
	readonly PUBLIC_MAPLIBRE_ZOOM: string;
	readonly BASE_PATH: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
