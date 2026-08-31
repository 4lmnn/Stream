
const video = 
    document.querySelector<HTMLVideoElement>("#video");

const ambientVideo =
  document.querySelector<HTMLVideoElement>("#ambient-video");

const streamStatus = 
    document.querySelector<HTMLParagraphElement>("#stream-status");

const statusText =
    document.querySelector<HTMLSpanElement>("#status-text");

const streamPlaceholder =
  document.querySelector<HTMLDivElement>("#stream-placeholder");

const placeholderText =
  document.querySelector<HTMLParagraphElement>("#placeholder-text");


if (!video ||
    !ambientVideo ||
    !streamStatus ||
    !statusText ||
    !streamPlaceholder ||
    !placeholderText)
{
    throw new Error("Faltan elementos necesarios en el HTML");
}

type StreamState =
  | "connecting"
  | "live"
  | "unavailable";


const setStreamState = (state: StreamState) =>
{
    streamStatus.dataset.state = state;
    streamPlaceholder.dataset.state = state;
    streamPlaceholder.hidden = state === "live";
    ambientVideo.hidden = state !== "live";

    switch (state)
    {
        case "connecting":
            statusText.textContent = "Conectando...";
            placeholderText.textContent = "Conectando…";
            break;
        case "live":
            statusText.textContent = "EN VIVO";
            break;
        case "unavailable":
            statusText.textContent = "Sin transmisión";
            placeholderText.textContent = "Sin transmisión en este momento";
            break;
    }
};

setStreamState("connecting");


    const streamUrl = new URL(
  "/media/classroom/whep",
  window.location.href
).href;

const reader = new window.MediaMTXWebRTCReader
({
    url: streamUrl,
    
    onTrack(event)
    {
        const stream = event.streams[0];
        if (!stream)
        {
            console.error("No se recibio ninguna transmision");
            return;
        }

        if (event.track.kind === "video")
        {
            const markUnavailable = () =>
            {
                setStreamState("unavailable");
            };

            event.track.addEventListener("mute", markUnavailable);
            event.track.addEventListener("ended", markUnavailable);
            event.track.addEventListener("unmute", () =>
            {
                setStreamState("live");
            });
        }

        video.srcObject = stream;
        ambientVideo.srcObject = stream;

        video.play().catch((error) =>
        {
            console.debug("No se pudo iniciar el video automáticamente:", error);
        });

        ambientVideo.play().catch((error) =>
        {
            console.debug("No se pudo iniciar el ambiente:", error);
        });
        setStreamState("live");
    },

    onError(message)
    {
        setStreamState("unavailable");
        console.error("MediaMTX:", message);
    }
});
