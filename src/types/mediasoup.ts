import { Device, Transport } from 'mediasoup-client';
import { RtpCapabilities, RtpParameters } from 'mediasoup-client/lib/RtpParameters';
import { SctpParameters } from 'mediasoup-client/lib/SctpParameters';

export interface MediasoupState {
  device: Device | null;
  sendTransport: Transport | null;
  recvTransport: Transport | null;
  rtpCapabilities: RtpCapabilities | null;
  isLoading: boolean;
  error: Error | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>; // producerId to Stream
  // Individual tracks for more granular control if needed later
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  remoteAudioTracks: Map<string, MediaStreamTrack>; // producerId to Audio Track
  remoteVideoTracks: Map<string, MediaStreamTrack>; // producerId to Video Track
}

// Socket Event Payloads

// Server -> Client: Inform client about router's capabilities
export type RouterRtpCapabilitiesData = RtpCapabilities;

// Client -> Server: Request to create a transport
// Server -> Client: Parameters for creating a transport
export interface TransportParams {
  id: string;
  iceParameters: object; // mediasoup-client/lib/IceParameters
  iceCandidates: object[]; // mediasoup-client/lib/IceCandidate
  dtlsParameters: object; // mediasoup-client/lib/DtlsParameters
  sctpParameters?: object; // mediasoup-client/lib/SctpParameters
}

// Client -> Server: DTLS parameters for connecting transport
export interface TransportConnectData {
  transportId: string;
  dtlsParameters: object; // mediasoup-client/lib/DtlsParameters
}

// Client -> Server: Parameters for producing media
export interface TransportProduceData {
  transportId: string;
  kind: 'audio' | 'video';
  rtpParameters: RtpParameters;
  appData?: Record<string, any>; // Custom application data
}

// Server -> Client: Response for transport.produce() -> id of the server-side producer
export interface TransportProduceResponse {
  id: string; // producerId
}

// Client -> Server: Request to consume a producer
export interface ConsumeData {
  producerId: string;
  rtpCapabilities: RtpCapabilities; // Consumer's RTP capabilities
  // transportId is implicit, server knows which transport is asking
}

// Server -> Client: Parameters for consuming a producer
export interface ConsumerParams {
  id: string; // server-side consumer ID
  producerId: string;
  kind: 'audio' | 'video';
  rtpParameters: RtpParameters;
  // appData might also be relevant here if server sends it
}

// Server -> Client: Notification of a new producer
export interface NewProducerData {
  producerId: string;
  kind: 'audio' | 'video';
  // appData might be included if relevant for initial setup
}

// Server -> Client: Notification that a producer has closed
export interface ProducerClosedData {
  producerId: string;
}

// General error response from socket
export interface SocketErrorData {
  message: string;
  details?: string;
}
