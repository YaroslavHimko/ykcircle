import { DEFAULT_SITE_DOMAIN } from '../site.config.js';

// Override this in deployment with VITE_SITE_DOMAIN when the website moves.
export const SITE_DOMAIN = import.meta.env.VITE_SITE_DOMAIN || DEFAULT_SITE_DOMAIN;
