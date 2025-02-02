import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface ShippingAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CreateOrderParams {
  stripeSessionId: string;
  size: string;
  color: string;
  shippingName: string;
  shippingAddress: ShippingAddress;
  orderNumber: number;
}

// First, let's add a function to verify variant IDs
async function verifyVariantId(variantId: number): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.printful.com/store/variants/${variantId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
          "X-PF-Store-Id": process.env.PRINTFUL_STORE_ID!,
        },
      },
    );

    if (!response.ok) {
      console.log(
        `Variant ID ${variantId} verification failed:`,
        await response.json(),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error verifying variant ID ${variantId}:`, error);
    return false;
  }
}

// Add this constant with the design URLs
const TSHIRT_DESIGN_URLS: Record<string, string> = {
  "Ice Blue":
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737209145/tshirt-numbers/black-tshirt_yvk7dm.png",
  Peach:
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737209145/tshirt-numbers/black-tshirt_yvk7dm.png",
  Black:
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737209145/tshirt-numbers/black-tshirt_yvk7dm.png",
  White:
    "https://res.cloudinary.com/wedgietracker/image/upload/v1737209145/tshirt-numbers/white-tshirt_edkxxi.png",
};

// Add interfaces for API responses
interface PrintfulFileResponse {
  result: {
    url: string;
  };
}

interface PrintfulOrderResponse {
  result: {
    id: number;
    // Add other fields as needed
  };
}

export async function createPrintfulDraftOrder({
  stripeSessionId,
  size,
  color,
  shippingName,
  shippingAddress,
  orderNumber,
}: CreateOrderParams) {
  const { printfulSize, printfulColor } = getPrintfulNames(size, color);
  const variantId = getVariantId(size, color);
  const designUrl = TSHIRT_DESIGN_URLS[printfulColor];

  // Verify the variant ID
  const isValidVariant = await verifyVariantId(variantId);
  if (!isValidVariant) {
    throw new Error(
      `Invalid variant ID: ${variantId} for ${printfulColor}-${printfulSize}`,
    );
  }

  // Generate SVG for the number with color based on t-shirt color
  const numberColor = printfulColor === "Black" ? "white" : "black";
  const numberSvg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg width="50" height="25" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <style type="text/css">
          @import url('https://fonts.googleapis.com/css2?family=Sono:wght@500&amp;display=swap');
        </style>
      </defs>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Sono', monospace" font-size="16" font-weight="500" fill="${numberColor}">
        ${orderNumber.toString().padStart(3, "0")}
      </text>
    </svg>`;

  // Upload SVG to Cloudinary and convert to PNG
  const uploadResponse = await cloudinary.uploader.upload(
    `data:image/svg+xml;base64,${Buffer.from(numberSvg).toString("base64")}`,
    {
      folder: "tshirt-numbers",
      public_id: `number-${orderNumber}`,
      resource_type: "image",
      format: "png",
      transformation: [
        { width: 1000, height: 500, crop: "scale" },
        { format: "png" },
      ],
    },
  );

  // Now use the Cloudinary PNG URL for Printful
  const artworkResponse = await fetch("https://api.printful.com/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "default",
      url: uploadResponse.secure_url,
      store_id: process.env.PRINTFUL_STORE_ID,
    }),
  });

  if (!artworkResponse.ok) {
    const errorData = (await artworkResponse.json()) as Record<string, unknown>;
    console.log("Artwork upload error:", errorData);
    throw new Error(
      `Failed to upload number artwork to Printful: ${JSON.stringify(errorData)}`,
    );
  }

  const {
    result: { url: numberArtworkUrl },
  } = (await artworkResponse.json()) as PrintfulFileResponse;

  if (!designUrl) {
    throw new Error(`No design found for color: ${printfulColor}`);
  }

  // Modify the orderData to include both design and number
  const orderData = {
    external_id: stripeSessionId.replace(/[^a-zA-Z0-9]/g, "").substring(0, 32),
    recipient: {
      name: shippingName,
      address1: shippingAddress.line1,
      address2: shippingAddress.line2 ?? "",
      city: shippingAddress.city,
      state_code: shippingAddress.state,
      country_code: shippingAddress.country,
      zip: shippingAddress.postalCode,
    },
    items: [
      {
        sync_variant_id: variantId,
        quantity: 1,
        files: [
          {
            type: "default",
            url: designUrl, // Main design
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 450,
              height: 459,
              top: 925,
              left: 750,
              limit_to_print_area: true,
            },
          },
          {
            type: "label_outside",
            url: numberArtworkUrl, // Number label
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch("https://api.printful.com/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PRINTFUL_API_KEY}`,
        "Content-Type": "application/json",
        "X-PF-Store-Id": process.env.PRINTFUL_STORE_ID!,
      },
      body: JSON.stringify({
        ...orderData,
        draft: 1,
        store_id: process.env.PRINTFUL_STORE_ID,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as Record<string, unknown>;
      console.log("Order creation error:", errorData);
      throw new Error(`Printful API error: ${JSON.stringify(errorData)}`);
    }

    const order = (await response.json()) as PrintfulOrderResponse;

    return order;
  } catch (error) {
    console.error("Printful order creation failed:", error);
    throw error;
  }
}

// Helper function to convert friendly names to Printful names
function getPrintfulNames(
  size: string,
  color: string,
): { printfulSize: string; printfulColor: string } {
  // Convert size
  const sizeMap: Record<string, string> = {
    XS: "XS",
    S: "S",
    M: "M",
    L: "L",
    XL: "XL",
    XXL: "2XL",
  };

  // Convert color
  const colorMap: Record<string, string> = {
    Black: "Black",
    White: "White",
    "Ice Blue": "Ice Blue",
    Peach: "Peach",
  };

  return {
    printfulSize: sizeMap[size] ?? size,
    printfulColor: colorMap[color] ?? color,
  };
}

function getVariantId(size: string, color: string): number {
  // Convert friendly names to Printful names
  const { printfulSize, printfulColor } = getPrintfulNames(size, color);

  const variantMap: Record<string, number> = {
    // Black OG Tshirt
    "Black-XS": 4691943036,
    "Black-S": 4691943037,
    "Black-M": 4691943038,
    "Black-L": 4691943039,
    "Black-XL": 4691943040,
    "Black-2XL": 4691943041,

    // White OG Tshirt
    "White-XS": 4691943183,
    "White-S": 4691943184,
    "White-M": 4691943185,
    "White-L": 4691943186,
    "White-XL": 4691943187,
    "White-2XL": 4691943188,

    // Ice Blue OG Tshirt
    "Ice Blue-XS": 4691945545,
    "Ice Blue-S": 4691945546,
    "Ice Blue-M": 4691945547,
    "Ice Blue-L": 4691945548,
    "Ice Blue-XL": 4691945549,
    "Ice Blue-2XL": 4691945550,

    // Peach OG Tshirt
    "Peach-XS": 4691945841,
    "Peach-S": 4691945842,
    "Peach-M": 4691945843,
    "Peach-L": 4691945844,
    "Peach-XL": 4691945845,
    "Peach-2XL": 4691945846,
  };

  const key = `${printfulColor}-${printfulSize}`;
  const variantId = variantMap[key];

  if (!variantId) {
    throw new Error(
      `No variant ID found for combination: ${key} (original: ${color}-${size})`,
    );
  }

  return variantId;
}
