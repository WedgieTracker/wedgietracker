"use client";

import { useState } from "react";
import { Loader } from "../shared/Loader";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "../ui/dialog";
import { VisuallyHidden } from "../ui/visually-hidden";

export function EasterEgg() {
  const [hover, setHover] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="top-0 left-0 flex w-full max-w-2xl items-center justify-center">
          <div
            className="mx-auto -mb-12 flex cursor-pointer items-center justify-center"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <div className="relative z-1 w-28 max-[360px]:w-24 sm:w-32 md:w-48">
              <div className="md:mr-none relative z-1 -mr-4">
                <Loader hover={hover} />
                <div className="to-darkpurple-dark absolute top-0 -right-1 z-10 h-full w-[50px] bg-linear-to-r from-transparent" />
              </div>
              {/* add a gradient from transparent to darkpurple on the last 50px of the div */}
            </div>
            <div className="sm:text-wedgies-text relative z-10 mt-[-.5em] text-3xl leading-none text-white">
              <div className="flex flex-row items-baseline gap-2">
                <span className="text-yellow text-[.6em] font-black">
                  Wedgie
                </span>
                <span className="text-pink text-[.5em]">/ˈwɛdʒi/</span>
                <span className="text-[.4em] text-white/50">NOUN</span>
              </div>
              <div className="mt-[.3em] pb-8 text-[.5em] leading-tight text-white/90">
                Basketball stuck between <br />
                the rim and the backboard
              </div>
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="border-none bg-transparent p-2 sm:max-w-[800px]">
        <VisuallyHidden>
          <DialogTitle>Basketball Wedgie Video</DialogTitle>
        </VisuallyHidden>
        <iframe
          src="https://www.youtube.com/embed/e198vxUYG8c?start=103&autoplay=1"
          title="Basketball Wedgie Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
}
