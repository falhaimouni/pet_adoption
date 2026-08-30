import rabbitImg from "../imports/MyPetopia/2a3e7edc9e48a9b54587cf4d62ebd398042902a1.png";
import goldenRetrieverImg from "../imports/MyPetopia/310c78da6978bd1c1f0658d7202cac1ad8141aca.png";
import persianCatImg from "../imports/MyPetopia/d297332b2c72bbab968e9869ca23efc085706d7b.png";
import poodleImg from "../imports/MyPetopia/24e2536ae8951f7e58a6a251b78040d254e6a249.png";
import chartrexImg from "../imports/MyPetopia/782532b753cb22c0157d258183952675ee18e9ae.png";
import goldenDogImg from "../imports/MyPetopia/6873b1dc8519e91f8d65e08b4fbf144707066349.png";

export type PetStatus = "available" | "pending" | "adopted";
export type PetSize = "Small" | "Medium" | "Large";

export interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: string;
  ageMonths: number;
  gender: "Male" | "Female";
  size: PetSize;
  location: string;
  city: string;
  status: PetStatus;
  image: string;
  description: string;
  personality: string[];
  color: string;
  weight: string;
  vaccinated: boolean;
  neutered: boolean;
  healthStatus: string;
  goodWithKids: boolean;
  goodWithPets: boolean;
  shelterName: string;
  shelterPhone: string;
  price: number;
  rating: number;
  reviewCount: number;
  tags: string[];
}

export const PETS: Pet[] = [
  {
    id: 1,
    name: "Mochi",
    species: "Dog",
    breed: "Golden Retriever",
    age: "2 years",
    ageMonths: 24,
    gender: "Male",
    size: "Large",
    location: "Amman, Jordan",
    city: "Amman",
    status: "available",
    image: goldenRetrieverImg,
    description:
      "Mochi is a cheerful, gentle Golden Retriever who brings sunshine everywhere he goes. He loves long walks, playing fetch, and snuggling on the couch. Extremely loyal and eager to please, he has completed basic obedience training and responds well to commands.",
    personality: ["Playful", "Loyal", "Gentle", "Energetic"],
    color: "Golden",
    weight: "28 kg",
    vaccinated: true,
    neutered: false,
    healthStatus: "Healthy",
    goodWithKids: true,
    goodWithPets: true,
    shelterName: "Petopia Amman Shelter",
    shelterPhone: "+962-6-5001234",
    price: 0,
    rating: 4.9,
    reviewCount: 14,
    tags: ["Family-friendly", "Trained", "Active"],
  },
  {
    id: 2,
    name: "Luna",
    species: "Cat",
    breed: "Persian",
    age: "1 year",
    ageMonths: 12,
    gender: "Female",
    size: "Small",
    location: "Amman, Jordan",
    city: "Amman",
    status: "available",
    image: persianCatImg,
    description:
      "Luna is a serene Persian with silky white fur and dreamy eyes. She enjoys quiet afternoons by the window, gentle brushing sessions, and the occasional chin scratch. Perfect for apartment life — calm, clean, and completely adorable.",
    personality: ["Calm", "Affectionate", "Independent", "Quiet"],
    color: "White",
    weight: "4 kg",
    vaccinated: true,
    neutered: true,
    healthStatus: "Healthy",
    goodWithKids: true,
    goodWithPets: false,
    shelterName: "Petopia Amman Shelter",
    shelterPhone: "+962-6-5001234",
    price: 0,
    rating: 4.8,
    reviewCount: 9,
    tags: ["Apartment-friendly", "Low-energy", "Groomed"],
  },
  {
    id: 3,
    name: "Coco",
    species: "Dog",
    breed: "Toy Poodle",
    age: "3 years",
    ageMonths: 36,
    gender: "Female",
    size: "Small",
    location: "Zarqa, Jordan",
    city: "Zarqa",
    status: "available",
    image: poodleImg,
    description:
      "Coco is one of the smartest dogs you will ever meet. This Toy Poodle has mastered over 15 tricks and loves the challenge of learning new ones. She bonds quickly with her family and thrives in an active, loving home.",
    personality: ["Intelligent", "Energetic", "Friendly", "Curious"],
    color: "Cream",
    weight: "5 kg",
    vaccinated: true,
    neutered: true,
    healthStatus: "Healthy",
    goodWithKids: true,
    goodWithPets: true,
    shelterName: "Zarqa Pet Rescue",
    shelterPhone: "+962-5-3826600",
    price: 0,
    rating: 4.7,
    reviewCount: 7,
    tags: ["Highly-trained", "Hypoallergenic", "Active"],
  },
  {
    id: 4,
    name: "Oliver",
    species: "Cat",
    breed: "Chartreux",
    age: "4 years",
    ageMonths: 48,
    gender: "Male",
    size: "Medium",
    location: "Irbid, Jordan",
    city: "Irbid",
    status: "available",
    image: chartrexImg,
    description:
      "Oliver is a devoted, observant Chartreux with a plush blue-grey coat and amber eyes. He is thoughtful and gentle — the kind of cat who will follow you from room to room and settle quietly beside you. Ideal for anyone wanting a loyal, low-fuss companion.",
    personality: ["Devoted", "Quiet", "Observant", "Gentle"],
    color: "Blue-grey",
    weight: "5.5 kg",
    vaccinated: true,
    neutered: true,
    healthStatus: "Healthy",
    goodWithKids: false,
    goodWithPets: false,
    shelterName: "Northern Jordan Animal Care",
    shelterPhone: "+962-2-7241100",
    price: 0,
    rating: 4.6,
    reviewCount: 5,
    tags: ["Calm", "Independent", "Great-lap-cat"],
  },
  {
    id: 5,
    name: "Daisy",
    species: "Rabbit",
    breed: "Dutch Rabbit",
    age: "6 months",
    ageMonths: 6,
    gender: "Female",
    size: "Small",
    location: "Amman, Jordan",
    city: "Amman",
    status: "available",
    image: rabbitImg,
    description:
      "Daisy is a curious, sprightly Dutch rabbit with a striking black-and-white coat. She loves foraging for fresh greens, exploring her space, and binkying when she is happy. A wonderful first pet — she is gentle, easy to care for, and full of personality.",
    personality: ["Curious", "Gentle", "Playful", "Social"],
    color: "Black & White",
    weight: "1.8 kg",
    vaccinated: false,
    neutered: false,
    healthStatus: "Healthy",
    goodWithKids: true,
    goodWithPets: false,
    shelterName: "Petopia Amman Shelter",
    shelterPhone: "+962-6-5001234",
    price: 0,
    rating: 4.5,
    reviewCount: 3,
    tags: ["Beginner-friendly", "Apartment-friendly", "Active"],
  },
  {
    id: 6,
    name: "Buddy",
    species: "Dog",
    breed: "Mixed Breed",
    age: "5 years",
    ageMonths: 60,
    gender: "Male",
    size: "Large",
    location: "Aqaba, Jordan",
    city: "Aqaba",
    status: "pending",
    image: goldenDogImg,
    description:
      "Buddy has been patiently waiting for his forever home. A calm and affectionate mixed-breed, he is as loyal as they come. He has lived with children before and was the gentlest, most protective presence in the home. He deserves a second chapter.",
    personality: ["Loyal", "Calm", "Protective", "Affectionate"],
    color: "Brown & White",
    weight: "22 kg",
    vaccinated: true,
    neutered: true,
    healthStatus: "Healthy",
    goodWithKids: true,
    goodWithPets: true,
    shelterName: "Aqaba Animal Welfare",
    shelterPhone: "+962-3-2013355",
    price: 0,
    rating: 4.9,
    reviewCount: 11,
    tags: ["Family-friendly", "Senior-friendly", "Gentle"],
  },
];

export const PET_CITIES = [...new Set(PETS.map((p) => p.city))];
export const PET_SPECIES = [...new Set(PETS.map((p) => p.species))];
export const PET_BREEDS = [...new Set(PETS.map((p) => p.breed))];
