export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type Color = "Black" | "White" | "Ice Blue" | "Peach";

export interface Product {
  id: string;
  name: string;
  price: number;
  sizes: Size[];
  colors: Color[];
  images: Record<Color, string>;
}
