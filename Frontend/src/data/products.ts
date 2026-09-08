export type ProductCategory =
  | "Food"
  | "Accessories"
  | "Health"
  | "Grooming"
  | "Beds & Blankets"
  | "Toys"
  | "Housing";

export interface Product {
  id: string | number;
  productId?: string;
  supplyId?: string;
  name: string;
  brand: string;
  category: ProductCategory | string;
  subCategory: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  badge?: "Sale" | "New" | "Best Seller" | "Bundle";
  description: string;
  forSpecies: string[];
  weight?: string;
}

import productImg1 from "../imports/MyPetopia/24e2536ae8951f7e58a6a251b78040d254e6a249.png";
import productImg2 from "../imports/MyPetopia/2a3e7edc9e48a9b54587cf4d62ebd398042902a1.png";
import productImg3 from "../imports/MyPetopia/310c78da6978bd1c1f0658d7202cac1ad8141aca.png";
import productImg4 from "../imports/MyPetopia/50431ebfa0084fcbc5b07bf62fb645508f62dedf.png";
import productImg5 from "../imports/MyPetopia/782532b753cb22c0157d258183952675ee18e9ae.png";
import productImg6 from "../imports/MyPetopia/d297332b2c72bbab968e9869ca23efc085706d7b.png";
import productImg7 from "../imports/Home/6873b1dc8519e91f8d65e08b4fbf144707066349.png";
import productImg8 from "../imports/Login/9bd62fd6b651515e439f303dbe7dcc8978ef5b6a.png";

const productImages = [
  productImg1,
  productImg2,
  productImg3,
  productImg4,
  productImg5,
  productImg6,
  productImg7,
  productImg8,
];

export const productImage = (index: number) => productImages[index % productImages.length];

export const PRODUCTS: Product[] = [
  // Food
  {
    id: 1,
    name: "Royal Canin Maxi Adult",
    brand: "Royal Canin",
    category: "Food",
    subCategory: "Dry Food",
    price: 18.99,
    originalPrice: 22.99,
    image: productImage(0),
    rating: 4.8,
    reviewCount: 312,
    inStock: true,
    badge: "Sale",
    description: "Complete dry food for large breed adult dogs. Rich in protein, supports joint health.",
    forSpecies: ["Dog"],
    weight: "4 kg",
  },
  {
    id: 2,
    name: "Whiskas Tender Bites",
    brand: "Whiskas",
    category: "Food",
    subCategory: "Wet Food",
    price: 2.49,
    image: productImage(1),
    rating: 4.6,
    reviewCount: 189,
    inStock: true,
    badge: "Best Seller",
    description: "Tender chicken pieces in jelly. Complete nutrition for adult cats.",
    forSpecies: ["Cat"],
    weight: "400g",
  },
  {
    id: 3,
    name: "Pedigree Training Treats",
    brand: "Pedigree",
    category: "Food",
    subCategory: "Treats",
    price: 4.99,
    image: productImage(2),
    rating: 4.7,
    reviewCount: 241,
    inStock: true,
    badge: "Best Seller",
    description: "Small, soft training treats. Low calorie, irresistible flavor dogs love.",
    forSpecies: ["Dog"],
    weight: "200g",
  },
  {
    id: 4,
    name: "Science Diet Kitten",
    brand: "Hill's",
    category: "Food",
    subCategory: "Dry Food",
    price: 24.99,
    originalPrice: 29.99,
    image: productImage(3),
    rating: 4.9,
    reviewCount: 178,
    inStock: true,
    badge: "Sale",
    description: "Precisely balanced nutrition for kittens. Supports brain and vision development.",
    forSpecies: ["Cat"],
    weight: "3.5 kg",
  },
  // Accessories
  {
    id: 5,
    name: "Adjustable Reflective Leash",
    brand: "PetSafe",
    category: "Accessories",
    subCategory: "Leashes",
    price: 12.99,
    image: productImage(4),
    rating: 4.7,
    reviewCount: 94,
    inStock: true,
    badge: "New",
    description: "6-foot reflective leash with padded handle. Retractable locking mechanism.",
    forSpecies: ["Dog"],
  },
  {
    id: 6,
    name: "No-Pull Harness",
    brand: "Ruffwear",
    category: "Accessories",
    subCategory: "Harnesses",
    price: 34.99,
    originalPrice: 44.99,
    image: productImage(5),
    rating: 4.8,
    reviewCount: 156,
    inStock: true,
    badge: "Sale",
    description: "Padded, front-clip harness for comfortable walks. Reflective trim for night visibility.",
    forSpecies: ["Dog"],
  },
  {
    id: 7,
    name: "Breakaway Safety Collar",
    brand: "Catit",
    category: "Accessories",
    subCategory: "Collars",
    price: 8.99,
    image: productImage(6),
    rating: 4.5,
    reviewCount: 67,
    inStock: true,
    description: "Safety breakaway buckle releases under pressure. Soft nylon, adjustable fit.",
    forSpecies: ["Cat"],
  },
  {
    id: 8,
    name: "Stainless Steel Bowl Set",
    brand: "Petopia",
    category: "Accessories",
    subCategory: "Bowls",
    price: 14.99,
    image: productImage(7),
    rating: 4.6,
    reviewCount: 83,
    inStock: true,
    badge: "Bundle",
    description: "Set of 2 non-slip stainless steel bowls. Dishwasher safe, anti-bacterial.",
    forSpecies: ["Dog", "Cat"],
  },
  // Beds & Blankets
  {
    id: 9,
    name: "Orthopedic Memory Foam Bed",
    brand: "FurHaven",
    category: "Beds & Blankets",
    subCategory: "Beds",
    price: 49.99,
    originalPrice: 64.99,
    image: productImage(8),
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    badge: "Sale",
    description: "Medical-grade memory foam relieves joint pressure. Water-resistant cover, machine washable.",
    forSpecies: ["Dog", "Cat"],
  },
  {
    id: 10,
    name: "Sherpa Fleece Blanket",
    brand: "Petopia",
    category: "Beds & Blankets",
    subCategory: "Blankets",
    price: 19.99,
    image: productImage(9),
    rating: 4.7,
    reviewCount: 118,
    inStock: true,
    badge: "Best Seller",
    description: "Ultra-soft double-sided sherpa blanket. Machine washable, anti-static, warm.",
    forSpecies: ["Dog", "Cat", "Rabbit"],
  },
  // Toys
  {
    id: 11,
    name: "Interactive Puzzle Feeder",
    brand: "Nina Ottosson",
    category: "Toys",
    subCategory: "Interactive Toys",
    price: 22.99,
    image: productImage(10),
    rating: 4.8,
    reviewCount: 145,
    inStock: true,
    badge: "Best Seller",
    description: "Level 2 puzzle feeder slows eating and stimulates natural foraging instincts.",
    forSpecies: ["Dog"],
  },
  {
    id: 12,
    name: "Feather Wand Cat Toy",
    brand: "Da Bird",
    category: "Toys",
    subCategory: "Cat Toys",
    price: 9.99,
    image: productImage(11),
    rating: 4.9,
    reviewCount: 267,
    inStock: true,
    badge: "Best Seller",
    description: "Spinning feather on flexible wand. Mimics real bird movement — cats go wild.",
    forSpecies: ["Cat"],
  },
  // Grooming
  {
    id: 13,
    name: "Self-Cleaning Slicker Brush",
    brand: "Hertzko",
    category: "Grooming",
    subCategory: "Brushes",
    price: 16.99,
    image: productImage(12),
    rating: 4.8,
    reviewCount: 432,
    inStock: true,
    badge: "Best Seller",
    description: "Fine bent bristles remove loose fur, mats, and tangles painlessly. Push-button cleaning.",
    forSpecies: ["Dog", "Cat"],
  },
  {
    id: 14,
    name: "Oatmeal Dog Shampoo",
    brand: "Burt's Bees",
    category: "Grooming",
    subCategory: "Shampoos",
    price: 11.49,
    image: productImage(13),
    rating: 4.7,
    reviewCount: 189,
    inStock: true,
    description: "Natural oatmeal formula soothes dry, itchy skin. pH balanced, tearless, sulfate-free.",
    forSpecies: ["Dog"],
    weight: "500ml",
  },
  // Health
  {
    id: 15,
    name: "Joint Support Supplement",
    brand: "Nutramax",
    category: "Health",
    subCategory: "Supplements",
    price: 28.99,
    image: productImage(14),
    rating: 4.8,
    reviewCount: 312,
    inStock: true,
    badge: "Best Seller",
    description: "Glucosamine + chondroitin chewables. Supports mobility and cartilage health in senior dogs.",
    forSpecies: ["Dog"],
    weight: "60 chews",
  },
  {
    id: 16,
    name: "Flea & Tick Prevention Collar",
    brand: "Seresto",
    category: "Health",
    subCategory: "Pest Control",
    price: 39.99,
    originalPrice: 52.99,
    image: productImage(15),
    rating: 4.9,
    reviewCount: 578,
    inStock: true,
    badge: "Sale",
    description: "8-month continuous flea and tick protection. Odorless, non-greasy, water-resistant.",
    forSpecies: ["Dog", "Cat"],
  },
  // Housing
  {
    id: 17,
    name: "Cat Tree Tower",
    brand: "Go Pet Club",
    category: "Housing",
    subCategory: "Cat Trees",
    price: 79.99,
    originalPrice: 99.99,
    image: productImage(16),
    rating: 4.7,
    reviewCount: 241,
    inStock: true,
    badge: "Sale",
    description: "5-tier cat tree with sisal scratching posts, hammock, and plush perches.",
    forSpecies: ["Cat"],
  },
  {
    id: 18,
    name: "Rabbit Starter Hutch",
    brand: "MidWest",
    category: "Housing",
    subCategory: "Cages",
    price: 64.99,
    image: productImage(17),
    rating: 4.5,
    reviewCount: 87,
    inStock: false,
    description: "Two-level rabbit hutch with pull-out tray, ramp, and exercise run attachment.",
    forSpecies: ["Rabbit"],
  },
];

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Food",
  "Accessories",
  "Health",
  "Grooming",
  "Beds & Blankets",
  "Toys",
  "Housing",
];
