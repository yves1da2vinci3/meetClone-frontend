import { useEffect, useState, useCallback, useRef } from 'react';
import mediasoupClient, { Device, Transport } from 'mediasoup-client';
import { RtpCapabilities, RtpParameters } from 'mediasoup-client/lib/RtpParameters';
import { Socket } from 'socket.io-client';
import {
  MediasoupState,
  RouterRtpCapabilitiesData,
  TransportParams,
  TransportConnectData,
  TransportProduceData,
  TransportProduceResponse,
  ConsumerParams,
  NewProducerData,
  ProducerClosedData,
  SocketErrorData,
} from '../types/mediasoup';

const initialMediasoupState: MediasoupState = {
  device: null,
  sendTransport: null,
  recvTransport: null,
  rtpCapabilities: null,
  isLoading: false,
  error: null,
  localStream: null,
  remoteStreams: new Map(),
  localAudioTrack: null,
  localVideoTrack: null,
  remoteAudioTracks: new Map(),
  remoteVideoTracks: new Map(),
};

export const useMediasoup = (socket: Socket | null, roomId: string) => {
  const [mediasoupState, setMediasoupState] = useState<MediasoupState>(initialMediasoupState);

  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);

  const loadDevice = useCallback(async (routerRtpCapabilities: RouterRtpCapabilitiesData) => {
    if (!routerRtpCapabilities) {
      console.error('loadDevice: routerRtpCapabilities are required');
      setMediasoupState(prev => ({ ...prev, error: new Error('Router RTP capabilities are required to load device') }));
      return;
    }
    try {
      const newDevice = new mediasoupClient.Device();
      await newDevice.load({ routerRtpCapabilities });
      deviceRef.current = newDevice;
      setMediasoupState(prev => ({ ...prev, device: newDevice, error: null }));
      console.log('Mediasoup device loaded:', newDevice);
    } catch (error) {
      console.error('Error loading mediasoup device:', error);
      if (error instanceof Error && error.name === 'UnsupportedError') {
        setMediasoupState(prev => ({ ...prev, error: new Error('Browser not supported') }));
      } else {
        setMediasoupState(prev => ({ ...prev, error: error instanceof Error ? error : new Error('Unknown error loading device') }));
      }
    }
  }, []);

  const createSendTransport = useCallback(async () => {
    if (!socket || !deviceRef.current) {
      console.error('Socket or device not available for creating send transport.');
      setMediasoupState(prev => ({ ...prev, error: new Error('Socket or device not ready') }));
      return;
    }

    console.log('Requesting to create send transport...');
    setMediasoupState(prev => ({ ...prev, isLoading: true }));

    try {
      socket.emit('createWebRtcTransport', { roomId, direction: 'send' }, async (params: { error?: string } & TransportParams) => {
        if (params.error) {
          console.error('Error creating WebRTC send transport on server:', params.error);
          setMediasoupState(prev => ({ ...prev, error: new Error(params.error), isLoading: false }));
          return;
        }

        if (!deviceRef.current) {
          console.error('Device became null before transport creation response.');
          setMediasoupState(prev => ({ ...prev, error: new Error('Device not available'), isLoading: false }));
          return;
        }

        console.log('Server params for send transport:', params);
        const transport = deviceRef.current.createSendTransport(params);
        sendTransportRef.current = transport;
        setMediasoupState(prev => ({ ...prev, sendTransport: transport, isLoading: false }));
        console.log('Send transport created:', transport);

        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
          console.log('Send transport connect event');
          if (!socket) {
            errback(new Error('Socket not available'));
            return;
          }
          socket.emit('connectTransport', { roomId, transportId: transport.id, dtlsParameters }, (response: { error?: string }) => {
            if (response.error) {
              console.error('Error connecting send transport:', response.error);
              errback(new Error(response.error));
            } else {
              console.log('Send transport connected successfully');
              callback();
            }
          });
        });

        transport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
          console.log('Send transport produce event:', { kind, rtpParameters, appData });
          if (!socket) {
            errback(new Error('Socket not available'));
            return;
          }
          socket.emit('transportProduce', { roomId, transportId: transport.id, kind, rtpParameters, appData }, (response: { error?: string; id?: string } & TransportProduceResponse) => {
            if (response.error) {
              console.error('Error on transport produce:', response.error);
              errback(new Error(response.error));
            } else if (response.id) {
              console.log('Media produced successfully, server producerId:', response.id);
              callback({ id: response.id }); // Pass server-side producerId to mediasoup-client
            } else {
              console.error('Invalid response from transportProduce');
              errback(new Error('Invalid response from transportProduce'));
            }
          });
        });

        // 'connectionstatechange' can be useful for debugging and UI updates
        transport.on('connectionstatechange', (state) => {
          console.log(`Send transport connection state changed to: ${state}`);
          // You might want to update parts of your state based on this
          if (state === 'failed' || state === 'closed' || state === 'disconnected') {
            // Handle failure, maybe try to reconnect or inform user
            console.error(`Send transport connection state is ${state}`);
          }
        });

      });
    } catch (error) {
      console.error('Error creating send transport:', error);
      setMediasoupState(prev => ({ ...prev, error: error instanceof Error ? error : new Error('Failed to create send transport'), isLoading: false }));
    }
  }, [socket, roomId]);


  const createRecvTransportAndConsume = useCallback(async () => {
    // This function was a placeholder and its logic is covered by createRecvTransport and consumeMedia.
    // console.log('createRecvTransportAndConsume called');
  }, []);

  const produceMedia = useCallback(async (track: MediaStreamTrack, appData?: Record<string, any>) => {
    if (!sendTransportRef.current) {
      console.error('produceMedia: Send transport is not initialized.');
      setMediasoupState(prev => ({ ...prev, error: new Error('Send transport is not initialized') }));
      return null; // Return null or throw to indicate failure
    }
    if (!track) {
      console.error('produceMedia: Track is required.');
      setMediasoupState(prev => ({ ...prev, error: new Error('Track is required for producing media')}));
      return null;
    }

    console.log(`produceMedia called with track (id: ${track.id}, kind: ${track.kind})`, appData);
    setMediasoupState(prev => ({ ...prev, isLoading: true }));

    try {
      // appData can be used to pass information about the producer to the server
      // e.g., { mediaType: 'webcam', anotherCustomProp: 'value' }
      const producer = await sendTransportRef.current.produce({ track, appData: appData || {} });

      console.log(`Producer created (id: ${producer.id}, kind: ${producer.kind})`, producer);

      // Store the track based on its kind
      if (track.kind === 'audio') {
        setMediasoupState(prev => ({ ...prev, localAudioTrack: track, isLoading: false, error: null }));
      } else if (track.kind === 'video') {
        setMediasoupState(prev => ({ ...prev, localVideoTrack: track, isLoading: false, error: null }));
      }
      // Update localStream (optional, depends on how you manage it)
      // If localStream is just a container for these tracks, you might need to reconstruct it or add to it.
      // For simplicity, managing individual tracks is often more robust.
      // You could also emit an event or return the producer object for the component to handle.

      return producer;
    } catch (error) {
      console.error('Error producing media:', error);
      setMediasoupState(prev => ({ ...prev, error: error instanceof Error ? error : new Error('Failed to produce media'), isLoading: false }));
      return null; // Return null or throw
    }
  }, [socket]); // socket is a dependency if any direct socket calls were made, but here it's indirect via transport

  const createRecvTransport = useCallback(async () => {
    if (!socket || !deviceRef.current) {
      console.error('Socket or device not available for creating recv transport.');
      setMediasoupState(prev => ({ ...prev, error: new Error('Socket or device not ready') }));
      return;
    }

    console.log('Requesting to create recv transport...');
    setMediasoupState(prev => ({ ...prev, isLoading: true }));

    try {
      socket.emit('createWebRtcTransport', { roomId, direction: 'recv' }, async (params: { error?: string } & TransportParams) => {
        if (params.error) {
          console.error('Error creating WebRTC recv transport on server:', params.error);
          setMediasoupState(prev => ({ ...prev, error: new Error(params.error), isLoading: false }));
          return;
        }

        if (!deviceRef.current) {
          console.error('Device became null before recv transport creation response.');
          setMediasoupState(prev => ({ ...prev, error: new Error('Device not available'), isLoading: false }));
          return;
        }

        console.log('Server params for recv transport:', params);
        const transport = deviceRef.current.createRecvTransport(params);
        recvTransportRef.current = transport;
        setMediasoupState(prev => ({ ...prev, recvTransport: transport, isLoading: false }));
        console.log('Recv transport created:', transport);

        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
          console.log('Recv transport connect event');
          if (!socket) {
            errback(new Error('Socket not available'));
            return;
          }
          socket.emit('connectTransport', { roomId, transportId: transport.id, dtlsParameters }, (response: { error?: string }) => {
            if (response.error) {
              console.error('Error connecting recv transport:', response.error);
              errback(new Error(response.error));
            } else {
              console.log('Recv transport connected successfully');
              callback();
            }
          });
        });

        // 'connectionstatechange' for recv transport
        transport.on('connectionstatechange', (state) => {
          console.log(`Recv transport connection state changed to: ${state}`);
          if (state === 'failed' || state === 'closed' || state === 'disconnected') {
            console.error(`Recv transport connection state is ${state}`);
            // Potentially close consumers associated with this transport or mark them as stale
          }
        });
      });
    } catch (error) {
      console.error('Error creating recv transport:', error);
      setMediasoupState(prev => ({ ...prev, error: error instanceof Error ? error : new Error('Failed to create recv transport'), isLoading: false }));
    }
  }, [socket, roomId]);

  const consumeMedia = useCallback(async (consumerParams: ConsumerParams): Promise<mediasoupClient.types.Consumer | null> => {
    if (!recvTransportRef.current) {
      console.error('consumeMedia: Receive transport is not initialized.');
      setMediasoupState(prev => ({ ...prev, error: new Error('Receive transport is not initialized') }));
      return null;
    }
    if (!consumerParams) {
      console.error('consumeMedia: consumerParams are required.');
      setMediasoupState(prev => ({ ...prev, error: new Error('consumerParams are required for consuming media') }));
      return null;
    }

    console.log('consumeMedia called with params:', consumerParams);
    setMediasoupState(prev => ({ ...prev, isLoading: true }));

    try {
      const consumer = await recvTransportRef.current.consume(consumerParams);
      console.log(`Consumer created (id: ${consumer.id}, kind: ${consumer.kind}, producerId: ${consumer.producerId})`, consumer);

      const { track, kind, producerId } = consumer;

      setMediasoupState(prev => {
        const newRemoteTracks = kind === 'audio' ? new Map(prev.remoteAudioTracks) : new Map(prev.remoteVideoTracks);
        newRemoteTracks.set(producerId, track);

        const newRemoteStreams = new Map(prev.remoteStreams);
        let stream = newRemoteStreams.get(producerId);
        if (!stream) {
          stream = new MediaStream();
          newRemoteStreams.set(producerId, stream);
        }
        // Check if track is not already in stream
        if (!stream.getTracks().find(t => t.id === track.id)) {
          stream.addTrack(track);
        }

        return {
          ...prev,
          ...(kind === 'audio' ? { remoteAudioTracks: newRemoteTracks } : { remoteVideoTracks: newRemoteTracks }),
          remoteStreams: newRemoteStreams,
          isLoading: false,
          error: null,
        };
      });

      // Optional: Listen for consumer events like 'trackended', 'transportclose', etc.
      consumer.on('trackended', () => {
        console.log(`Consumer track ended (consumerId: ${consumer.id}, producerId: ${producerId})`);
        // Remove track and stream if necessary
        setMediasoupState(prev => {
          const newRemoteTracks = kind === 'audio' ? new Map(prev.remoteAudioTracks) : new Map(prev.remoteVideoTracks);
          newRemoteTracks.delete(producerId);

          const newRemoteStreams = new Map(prev.remoteStreams);
          const stream = newRemoteStreams.get(producerId);
          if (stream) {
            const mediaTrack = stream.getTrackById(track.id);
            if (mediaTrack) stream.removeTrack(mediaTrack);
            if (stream.getTracks().length === 0) {
              newRemoteStreams.delete(producerId);
            }
          }
          return {
            ...prev,
            ...(kind === 'audio' ? { remoteAudioTracks: newRemoteTracks } : { remoteVideoTracks: newRemoteTracks }),
            remoteStreams: newRemoteStreams,
          };
        });
      });

      consumer.on('transportclose', () => {
        console.log(`Consumer's transport closed (consumerId: ${consumer.id}, producerId: ${producerId})`);
        // Handled by transport's connectionstatechange or main cleanup
      });

      return consumer;
    } catch (error) {
      console.error('Error consuming media:', error);
      setMediasoupState(prev => ({ ...prev, error: error instanceof Error ? error : new Error('Failed to consume media'), isLoading: false }));
      return null;
    }
  }, [socket, recvTransportRef.current]); // recvTransportRef.current can be a dependency if its methods are directly called

  // Effect for initialization (e.g., fetching RTP caps, creating device)
  useEffect(() => {
    if (!socket || !roomId) {
      // Reset state if socket or roomId becomes null
      setMediasoupState(initialMediasoupState);
      deviceRef.current = null;
      sendTransportRef.current = null;
      recvTransportRef.current = null;
      return;
    }

    setMediasoupState(prev => ({ ...prev, isLoading: true, error: null }));

    const _getRouterRtpCapabilities = async (): Promise<RouterRtpCapabilitiesData | null> => {
      if (!socket) return null;

      return new Promise((resolve, reject) => {
        socket.emit('getRouterRtpCapabilities', { roomId }, (response: { error?: string; rtpCapabilities?: RouterRtpCapabilitiesData }) => {
          if (response.error) {
            reject(new Error(response.error));
          } else if (response.rtpCapabilities) {
            resolve(response.rtpCapabilities);
          } else {
            reject(new Error('Invalid response from getRouterRtpCapabilities'));
          }
        });
        // TODO: Add timeout for the socket request
      });
    };

    const initializeMediasoup = async () => {
      if (!socket || !roomId) return;

      setMediasoupState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        console.log('Fetching RTP capabilities for room:', roomId);
        const routerRtpCapabilities = await _getRouterRtpCapabilities();

        if (routerRtpCapabilities) {
          setMediasoupState(prev => ({ ...prev, rtpCapabilities: routerRtpCapabilities }));
          await loadDevice(routerRtpCapabilities);
          console.log('RTP capabilities fetched and device loading initiated.');
        } else {
          throw new Error('Failed to get Router RTP Capabilities');
        }
        // isLoading is set to false within loadDevice or if an error occurs earlier.
        // However, if loadDevice is successful, it sets error to null.
        // We only set isLoading to false here if there was an error *before* calling loadDevice.
        // The final isLoading: false should be after all successful async ops in this block.
      } catch (err) {
        console.error('Error during mediasoup initialization:', err);
        setMediasoupState(prev => ({ ...prev, error: err instanceof Error ? err : new Error(String(err)), isLoading: false }));
      } finally {
        // Ensure isLoading is false after all operations in this block
        setMediasoupState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeMediasoup();

  }, [socket, roomId, loadDevice]);

  // Effect for cleanup
  useEffect(() => {
    return () => {
      console.log('Cleaning up mediasoup transports');
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();

      // Remove any socket listeners specific to this hook if they were added directly
      // For example:
      // socket?.off('some-mediasoup-event');
      // Example of cleaning up listeners for server-sent events:
      if (socket) {
        socket.off('new-producer'); // Hypothetical event for new producer
        socket.off('producer-closed'); // Hypothetical event for producer closed
        // Add any other specific listeners that might have been set up by the hook
      }

      // Reset refs
      deviceRef.current = null;
      sendTransportRef.current = null;
      recvTransportRef.current = null;
      // Reset state to initial when hook is unmounted
      setMediasoupState(initialMediasoupState);
    };
  }, [socket]); // Added socket as a dependency, so if socket instance changes, cleanup for old one is run.

  return {
    ...mediasoupState,
    loadDevice,
    createSendTransport,
    createRecvTransport,
    produceMedia,
    consumeMedia,
    // createRecvTransportAndConsume should not be exported if it's a removed placeholder
  };
};
