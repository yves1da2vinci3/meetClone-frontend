import { useEffect, useState } from "react";
import { Tooltip } from "@mantine/core";
import { MdFullscreen, MdFullscreenExit } from "react-icons/md";

function FullscreenButton() {
  const [fs, setFs] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Tooltip label={fs ? "Quitter plein écran" : "Plein écran (F)"}>
      <button
        type="button"
        onClick={toggle}
        className={`${
          fs ? "bg-black" : "bg-white"
        } shadow-sm border h-10 w-10 cursor-pointer flex items-center justify-center rounded-md`}
      >
        {fs ? (
          <MdFullscreenExit color="white" size={18} />
        ) : (
          <MdFullscreen color="gray" size={18} />
        )}
      </button>
    </Tooltip>
  );
}

export default FullscreenButton;
