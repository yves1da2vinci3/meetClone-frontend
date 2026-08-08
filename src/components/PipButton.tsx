import { useEffect, useState } from "react";
import { Tooltip } from "@mantine/core";
import { MdPictureInPictureAlt } from "react-icons/md";

function findPipVideo(): HTMLVideoElement | null {
  const share = document.querySelector(
    ".lk-participant-tile[data-lk-source='screen_share'] video, .lk-participant-tile video[data-lk-source='screen_share']"
  ) as HTMLVideoElement | null;
  if (share) return share;
  const focused = document.querySelector(
    ".lk-focus-layout video, .lk-participant-tile video"
  ) as HTMLVideoElement | null;
  return focused;
}

function PipButton() {
  const [active, setActive] = useState(!!document.pictureInPictureElement);
  const supported =
    typeof document !== "undefined" && !!document.pictureInPictureEnabled;

  useEffect(() => {
    const onLeave = () => setActive(!!document.pictureInPictureElement);
    document.addEventListener("leavepictureinpicture", onLeave);
    return () => document.removeEventListener("leavepictureinpicture", onLeave);
  }, []);

  const toggle = async () => {
    if (!supported) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setActive(false);
        return;
      }
      const el = findPipVideo();
      if (!el) return;
      await el.requestPictureInPicture();
      setActive(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Tooltip
      label={
        supported
          ? active
            ? "Quitter PiP"
            : "Picture-in-Picture"
          : "PiP non supporté"
      }
    >
      <button
        type="button"
        disabled={!supported}
        onClick={toggle}
        className={`${
          active ? "bg-black" : "bg-white"
        } shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md disabled:opacity-40`}
      >
        <MdPictureInPictureAlt color={active ? "white" : "gray"} size={18} />
      </button>
    </Tooltip>
  );
}

export default PipButton;
