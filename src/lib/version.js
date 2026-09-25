// The release shown in the site footer. To release: bump "version" in package.json and set the date here.
import { version } from '../../package.json';

/** '0.26.0' -> '0.26', '0.26.1' stays '0.26.1' */
export const APP_VERSION = version.replace(/\.0$/, '');
export const RELEASE_DATE = '2026-09-25';
