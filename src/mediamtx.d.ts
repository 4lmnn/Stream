interface Window {
  MediaMTXWebRTCReader: new (options: {
    url: string;
    onTrack?: (event: RTCTrackEvent) => void;
    onError?: (message: string) => void;
  }) => {
    close(): void;
  };
}