import mediasoupClient, { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { Transport } from "mediasoup-client/lib/types";
import { Socket } from "socket.io-client";

// Type definitions for the set functions
type SetFunction<T> = (value: T) => void;

/**
 * Step 1: Retrieve the Router's RTP Capabilities.
 * This function requests the router's RTP capabilities from the server,
 * which are essential to configure the mediasoup Device.
 * The router's RTP capabilities describe the codecs and RTP parameters supported by the router.
 * This information is crucial for ensuring that the Device is compatible with the router.
 */
const getRouterRtpCapabilities = async (
  socket: Socket,
  setRtpCapabilities: SetFunction<RtpCapabilities>
) => {
  socket.emit(
    "getRouterRtpCapabilities",
    (data: { routerRtpCapabilities: RtpCapabilities }) => {
      setRtpCapabilities(data.routerRtpCapabilities);
      console.log(
        `getRouterRtpCapabilities: ${JSON.stringify(
          data.routerRtpCapabilities
        )}`
      );
    }
  );
};

/**
 * Step 2: Create and Initialize the mediasoup Device.
 * This function creates a new mediasoup Device instance and loads the router's RTP capabilities into it.
 * The Device is a client-side entity that provides an API for managing sending/receiving media with a mediasoup server.
 * Loading the router's RTP capabilities ensures that the Device is aware of the codecs and RTP parameters it needs to use
 * to successfully send and receive media with the server.
 *
 * If the Device is unable to load the router's RTP capabilities (e.g., due to an unsupported browser),
 * an error is logged to the console.
 */
const createDevice = async (
  setDevice: SetFunction<Device>,
  rtpCapabilities: RtpCapabilities
) => {
  try {
    const device = new Device();
    await device.load({ routerRtpCapabilities: rtpCapabilities });
    setDevice(device);
  } catch (error: any) {
    console.error(error);
    if (error.name === "UnsupportedError") {
      console.error("Browser not supported");
    }
  }
};

/**
 * Step 3: Create a Transport for Sending Media.
 * This function initiates the creation of a transport on the server-side for sending media,
 * and then replicates the transport on the client-side using the parameters returned by the server.
 */
const createSendTransport = async (
  socket: Socket,
  device: Device | null,
  setProducerTransport: SetFunction<any>
) => {
  console.log('creating transport....')
  socket.emit(
    "createTransport",
    { sender: true }
  );
  socket.on('transportCreated',(data)=>{
    const transportParams =  data.transport
    const transport = device?.createSendTransport({...transportParams});
    setProducerTransport(transport);
    transport?.on(
      "connect",
      async ({ dtlsParameters   }: any, callback: any, errback: any) => {
        try {
          await socket.emit("connectProducerTransport", { dtlsParameters , transportId : transportParams.id });
          callback();
        } catch (error) {
          errback(error);
        }
      }
    );

    transport?.on(
      "produce",
      async (parameters: any, callback: any, errback: any) => {
        const { kind, rtpParameters } = parameters;
        try {
          socket.emit(
            "transport-produce",
            { kind, rtpParameters, transportId : transportParams.id },
            ({ id }: any) => {
              callback({ id });
            }
          );
        } catch (error) {
          errback(error);
        }
      }
    );
  })
};

const startPublishing = async (
  transport: Transport,
  localVideoRef: React.RefObject<HTMLVideoElement>
): Promise<void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    await transport.produce({ track: videoTrack });
    await transport.produce({ track: audioTrack });
  } catch (error) {
    console.error('Error in startPublishing:', error);
  }
};

const createRecvTransport = async (
  socket: Socket,
  device: Device,
  setConsumerTransport: SetFunction<any>
) => {
  socket.emit(
    "createTransport",
    { sender: false },
    ({ params }: { params: any }) => {
      if (params.error) {
        console.error(params.error);
        return;
      }

      const transport = device.createRecvTransport(params);
      setConsumerTransport(transport);

      transport.on(
        "connect",
        async ({ dtlsParameters }: any, callback: any, errback: any) => {
          try {
            await socket.emit("transport-recv-connect", { dtlsParameters });
            callback();
          } catch (error) {
            errback(error);
          }
        }
      );
    }
  );
};

const connectRecvTransport = async (
  socket: Socket,
  device: Device,
  consumerTransport: any,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  socket.emit(
    "consume",
    { rtpCapabilities: device.rtpCapabilities },
    async ({ params }: any) => {
      if (params.error) {
        console.error(params.error);
        return;
      }

      const consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters,
      });

      const { track } = consumer;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = new MediaStream([track]);
      }

      socket.emit("consume-resume");
    }
  );
};

export {
  getRouterRtpCapabilities,
  createDevice,
  createSendTransport,
  startPublishing,
  createRecvTransport,
  connectRecvTransport,
};
