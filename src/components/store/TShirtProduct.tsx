"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "~/trpc/react";
import type { Size, Color } from "~/types/product";
import { cn } from "~/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";

import styles from "./TShirtProduct.module.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS: Color[] = ["Black", "White", "Ice Blue", "Peach"];
const PRICE = 3499; // $34.99

const TSHIRT_IMAGES: Record<Color, string[]> = {
  Black: [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220659/mockups-tshirt/open-black_zurvux.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220658/mockups-tshirt/side-black_ubzmjd.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800463/mockups-tshirt/back-black_irqltu.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800464/mockups-tshirt/number-black_sbfoxw.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220662/mockups-tshirt/folded-black_xyfesd.png",
  ],
  "Ice Blue": [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220659/mockups-tshirt/open-blue_juilfa.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220658/mockups-tshirt/side-blue_nzoi2w.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800463/mockups-tshirt/back-blue_rcnniv.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800464/mockups-tshirt/number-blue_gsimmx.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220662/mockups-tshirt/folded-blue_eblukm.png",
  ],
  Peach: [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220658/mockups-tshirt/open-peach_olaahj.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220658/mockups-tshirt/side-peach_xjn2om.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800464/mockups-tshirt/back-peach_bzdn9v.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800464/mockups-tshirt/number-peach_bcrds8.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737220660/mockups-tshirt/folded-peach_llbbng.png",
  ],
  White: [
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737221066/mockups-tshirt/open-white_g04hvv.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737221066/mockups-tshirt/side-white_tiyzjx.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800463/mockups-tshirt/back-white_ssvodq.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737800463/mockups-tshirt/number-white_fgsmgd.png",
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737221067/mockups-tshirt/folded-white_nmxh0p.png",
  ],
};

// Sort resources by view type order
const viewOrder = ["folded", "number", "open", "back", "side"];

export function TShirtProduct() {
  const [selectedSize, setSelectedSize] = useState<Size>("M");
  const [selectedColor, setSelectedColor] = useState<Color>("Black");
  const [loading, setLoading] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState<{
    totalWedgies: number;
    currentOrders: number;
    inventory: number;
    currentNumber: number;
  }>({
    totalWedgies: 0,
    currentOrders: 0,
    inventory: 0,
    currentNumber: 0,
  });
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const messages = [
    "Getting the total number of wedgies...",
    "Counting total orders...",
    "Generating your t-shirt...",
  ];

  const checkoutMutation = api.store.createCheckoutSession.useMutation({
    onSuccess: async (sessionId) => {
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId });
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      setLoading(false);
    },
  });

  const handleBuyNow = async () => {
    setLoading(true);
    checkoutMutation.mutate({
      size: selectedSize,
      color: selectedColor,
      price: PRICE,
      currentNumber: availableQuantity.currentNumber,
    });
  };

  // Get available quantity
  const {
    data: quantity,
    isLoading: isLoadingQuantity,
    error,
  } = api.store.getAvailableQuantity.useQuery();

  useEffect(() => {
    if (quantity !== undefined) {
      setAvailableQuantity(quantity);
    }
    if (error) {
      console.error("Error fetching quantity:", error);
      setAvailableQuantity({
        totalWedgies: 0,
        currentOrders: 0,
        inventory: 0,
        currentNumber: 0,
      });
    }
  }, [quantity, error]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessage((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Sort the images for the current color
  const sortedImages = [...(TSHIRT_IMAGES[selectedColor] ?? [])].sort(
    (a, b) => {
      const viewA = a.split("/").pop()?.split("-")[0] ?? "";
      const viewB = b.split("/").pop()?.split("-")[0] ?? "";
      return viewOrder.indexOf(viewA) - viewOrder.indexOf(viewB);
    },
  );

  if (isLoadingQuantity) {
    return (
      <div className="mx-auto flex aspect-[16/8] w-full max-w-6xl flex-col items-center justify-center rounded-xl bg-darkpurple-light/30 p-8 text-center">
        <h2 className="text-3xl font-bold text-yellow">Loading...</h2>
        <p className="mt-4 text-white">{messages[loadingMessage]}</p>
      </div>
    );
  }

  if (availableQuantity.inventory <= 0) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-darkpurple-light/30 p-4 text-center md:p-8">
        <h2 className="rounded-xl bg-pink px-4 py-2 text-3xl font-bold uppercase text-darkpurple">
          Sold Out
        </h2>
        <p className="mt-4 text-white">
          T-shirts are limited to the total number of wedgies. Check back after
          more wedgies happen!
        </p>
        {/* add images */}
        <div className="mt-4 flex flex-row items-center justify-center gap-4 overflow-x-scroll">
          {Object.entries(TSHIRT_IMAGES).map(([color, images]) => (
            <div key={color} className="w-[20%]">
              <img
                src={images[4]}
                alt={`${color} T-shirt view `}
                className="w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const SvgNumber = ({
    number,
    selectedColor,
    position,
  }: {
    number: number;
    selectedColor: Color;
    position: "number" | "back";
  }) => {
    const numberColor = selectedColor === "Black" ? "white" : "black";
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          width: "40%",
          height: "40%",
          top: position === "number" ? "41%" : "13%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <text
          x="50"
          y="50"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{
            fontSize: position === "number" ? "44px" : "5px",
          }}
          opacity={0.8}
          fill={numberColor}
        >
          {number.toString().padStart(3, "0")}
        </text>
      </svg>
    );
  };

  return (
    <div
      className={cn(
        styles.tshirtProduct,
        "mx-auto max-w-6xl rounded-xl bg-transparent p-0 md:bg-darkpurple-light/30 md:p-8",
      )}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="flex flex-col gap-4">
          <div
            onClick={() => setDialogOpen(true)}
            className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-darkpurple-light/50"
          >
            <img
              src={sortedImages[selectedImageIndex]}
              alt={`${selectedColor} T-shirt view ${selectedImageIndex + 1}`}
              className="h-full w-full object-contain transition-transform group-hover:scale-105"
            />
            {/* Number overlay */}
            {sortedImages[selectedImageIndex]?.includes("/number-") ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 transform transition-transform duration-300 group-hover:scale-105">
                <SvgNumber
                  number={availableQuantity.currentNumber}
                  selectedColor={selectedColor}
                  position="number"
                />
              </div>
            ) : sortedImages[selectedImageIndex]?.includes("/back-") ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 transform transition-transform duration-300 group-hover:scale-105">
                <SvgNumber
                  number={availableQuantity.currentNumber}
                  selectedColor={selectedColor}
                  position="back"
                />
              </div>
            ) : null}
            {/* Thumbnails overlay */}
            <div
              className={cn(
                styles.tshirtProduct,
                "absolute bottom-0 left-0 right-0 flex justify-center gap-2 bg-gradient-to-t from-darkpurple-lighter to-transparent p-4 opacity-90 transition-opacity group-hover:opacity-100",
              )}
            >
              {sortedImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent dialog from opening
                    setSelectedImageIndex(index);
                  }}
                  className={cn(
                    "relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all",
                    selectedImageIndex === index
                      ? "border-yellow"
                      : "border-transparent hover:border-white/20",
                  )}
                >
                  <img
                    src={image}
                    alt={`${selectedColor} T-shirt view ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {/* Number overlay */}
                  {image.includes("/number-") ? (
                    <SvgNumber
                      number={availableQuantity.currentNumber}
                      selectedColor={selectedColor}
                      position="number"
                    />
                  ) : image.includes("/back-") ? (
                    <SvgNumber
                      number={availableQuantity.currentNumber}
                      selectedColor={selectedColor}
                      position="back"
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-h-[90vh] max-w-[90vw] border-darkpurple-light bg-darkpurple-light/95 p-0 md:max-w-2xl lg:max-w-4xl">
              <DialogTitle className="sr-only">
                T-shirt Image Gallery
              </DialogTitle>
              <div
                className={cn(
                  styles.tshirtProduct,
                  "flex max-h-[80vh] w-full flex-col",
                )}
              >
                <div className="relative aspect-square min-h-0 flex-1">
                  <img
                    src={sortedImages[selectedImageIndex]}
                    alt={`${selectedColor} T-shirt view ${selectedImageIndex + 1}`}
                    className="h-full w-full object-contain"
                  />
                  {sortedImages[selectedImageIndex]?.includes("/number-") ? (
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 transform transition-transform duration-300 group-hover:scale-105">
                      <SvgNumber
                        number={availableQuantity.currentNumber}
                        selectedColor={selectedColor}
                        position="number"
                      />
                    </div>
                  ) : sortedImages[selectedImageIndex]?.includes("/back-") ? (
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 transform transition-transform duration-300 group-hover:scale-105">
                      <SvgNumber
                        number={availableQuantity.currentNumber}
                        selectedColor={selectedColor}
                        position="back"
                      />
                    </div>
                  ) : null}
                  {/* Thumbnails overlay */}
                  <div
                    className={cn(
                      styles.tshirtProduct,
                      "absolute bottom-0 left-0 right-0 flex justify-center gap-2 bg-gradient-to-t from-darkpurple-light/80 to-transparent p-1 pb-3 md:p-4 md:pb-4",
                    )}
                  >
                    {sortedImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          "relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-12 sm:w-12 md:h-16 md:w-16",
                          selectedImageIndex === index
                            ? "border-yellow"
                            : "border-transparent hover:border-white/20",
                        )}
                      >
                        <img
                          src={image}
                          alt={`${selectedColor} T-shirt view ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        {/* Number overlay */}
                        {image.includes("/number-") ? (
                          <SvgNumber
                            number={availableQuantity.currentNumber}
                            selectedColor={selectedColor}
                            position="number"
                          />
                        ) : image.includes("/back-") ? (
                          <SvgNumber
                            number={availableQuantity.currentNumber}
                            selectedColor={selectedColor}
                            position="back"
                          />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Product details */}
        <div className="flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-yellow md:text-3xl">
            OG Wedgie T-Shirt
          </h2>
          <div className="flex items-center justify-between md:items-end">
            <div className="text-2xl font-bold leading-none text-white">
              <p className="text-2xl font-bold leading-none text-white">
                $ {(PRICE / 100).toFixed(2)}
              </p>
              <p className="mt-1.5 text-[10px] text-white/60 md:text-sm">
                Free worldwide shipping
              </p>
            </div>
            <p className="rounded-lg bg-pink px-4 py-2 text-center text-[6px] font-bold uppercase text-white md:-mt-16 md:text-[10px]">
              <span className="mb-[.005em] block text-[4em] font-black leading-[1em] text-yellow">
                {availableQuantity.inventory}
              </span>
              <span className="mb-[.2em] block text-[2em] leading-[1em] text-white">
                of {availableQuantity.totalWedgies}
              </span>
              <span className="block text-[1.2em] leading-[1em] text-white">
                remaining
              </span>
            </p>
          </div>

          {/* Size selector */}
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase text-white/60">
              Size
            </h3>
            <div className="flex gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "h-8 min-w-8 rounded-lg border-2 px-2 text-sm font-bold transition-all md:h-10 md:min-w-10 md:text-base",
                    selectedSize === size
                      ? "border-yellow bg-yellow text-darkpurple"
                      : "border-white/20 text-white hover:border-white/40",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color selector */}
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase text-white/60">
              Color
            </h3>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 rounded-lg px-4 text-sm font-bold transition-all md:h-10 md:text-base",
                    selectedColor === color
                      ? "bg-yellow text-darkpurple"
                      : "bg-darkpurple-light text-white hover:bg-darkpurple-light/80",
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Add personalization info */}
          <p className="text-sm font-bold uppercase text-yellow">
            Each t-shirt is uniquely numbered.
          </p>

          <p className="text-xl font-bold text-white">
            Yours will be{" "}
            <span className="ml-2 rounded-lg bg-yellow px-2 py-1 font-bold text-darkpurple">
              #{availableQuantity.currentNumber}
            </span>
          </p>

          <span className="text-sm text-white/80">
            The number will be printed on the back of your t-shirt. It will be
            confirmed after your order is placed.
          </span>

          <button
            onClick={handleBuyNow}
            disabled={loading}
            className="mt-8 rounded-lg bg-pink px-8 py-4 font-bold text-white transition-all hover:bg-pink/80 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
