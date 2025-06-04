/**
 * This service previously contained standalone functions for interacting with Mediasoup.
 * All core Mediasoup logic, including device management, transport creation,
 * producing, and consuming media, has been refactored into the `useMediasoup` hook.
 *
 * The `useMediasoup` hook provides a comprehensive and stateful interface for
 * Mediasoup operations within React components.
 *
 * Components that previously used functions from this file should be updated
 * to use the `useMediasoup` hook instead.
 *
 * Example:
 * import { useMediasoup } from './mediasoupService'; // or directly from '../hooks/useMediasoup'
 *
 * function MyVideoComponent() {
 *   const { device, produceMedia, consumeMedia, ... } = useMediasoup(socket, roomId);
 *   // ... component logic using the hook's state and functions
 * }
 */

export { useMediasoup } from '../hooks/useMediasoup';

// Optionally, if there are any truly independent utility functions related to Mediasoup
// (that don't fit within the hook's stateful logic and are pure functions),
// they could remain here. However, based on the previous content, all functions
// were tightly coupled with the Mediasoup connection lifecycle and state,
// which is now managed by the useMediasoup hook.
