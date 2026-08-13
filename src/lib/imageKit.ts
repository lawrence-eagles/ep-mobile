import ImageKit from "imagekit-javascript";

import {
  authenticationEndpoint,
  publicKey,
  urlEndpoint,
} from "@/config/imageKit";

/**
 * ImageKit configuration options.
 *
 * `urlEndpoint` is required for generating ImageKit URLs.
 * `publicKey` and `authenticationEndpoint` are required for
 * client-side uploads.
 */
const imageKitConfig: {
  urlEndpoint: string;
  publicKey?: string;
  authenticationEndpoint?: string;
} = {
  urlEndpoint,
};

/**
 * Add upload configuration only when it has been provided.
 *
 * This is important because ImageKit's TypeScript definitions
 * expect these properties to be present only when they are
 * actually configured.
 */
if (publicKey) {
  imageKitConfig.publicKey = publicKey;
}

if (authenticationEndpoint) {
  imageKitConfig.authenticationEndpoint = authenticationEndpoint;
}

/**
 * Shared ImageKit client.
 *
 * This instance is used throughout the Expo application for:
 * - Generating optimized image URLs
 * - Applying ImageKit transformations
 * - Client-side image uploads
 */
const imageKit = new ImageKit(imageKitConfig);

export default imageKit;
