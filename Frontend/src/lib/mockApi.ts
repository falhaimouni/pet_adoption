import { PETS } from "../data/pets";
import { PRODUCTS } from "../data/products";

export const MOCK_API_ENABLED = import.meta.env.VITE_USE_MOCKS === "true";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const now = () => new Date().toISOString();

function readBody(init: RequestInit) {
  if (!init.body || init.body instanceof FormData) return {};
  try {
    return JSON.parse(String(init.body)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function roleFromEmail(email = "") {
  const prefix = email.split("@")[0].toLowerCase();
  if (prefix.includes("admin")) return "ADMIN";
  if (prefix.includes("manager")) return "MANAGER";
  if (prefix.includes("staff") || prefix.includes("employee")) return "EMPLOYEE";
  if (prefix.includes("vet") || prefix.includes("doctor")) return "VET";
  return "ADOPTER";
}

function mockProfile(email = "adopter@petopia.test") {
  const roleName = roleFromEmail(email);
  const provider = email.toLowerCase().includes("google") ? "GOOGLE" : "LOCAL";
  return {
    userId: `mock-${roleName.toLowerCase()}`,
    id: `mock-${roleName.toLowerCase()}`,
    email,
    firstName: roleName === "VET" ? "Dr. Sara" : roleName.charAt(0) + roleName.slice(1).toLowerCase(),
    lastName: "Demo",
    phone: "+962-6-5001234",
    avatar: null,
    provider,
    status: "ACTIVE",
    createdAt: "2026-01-10T09:00:00.000Z",
    updatedAt: now(),
    role: { roleName },
    roleName,
  };
}

let currentProfile = mockProfile(localStorage.getItem("petopia_mock_email") ?? undefined);

let pets = PETS.map((pet) => ({
  petId: String(pet.id),
  name: pet.name,
  species: pet.species,
  breed: pet.breed,
  age: Math.floor(pet.ageMonths / 12),
  gender: pet.gender,
  color: pet.color,
  weight: Number.parseFloat(pet.weight),
  description: pet.description,
  healthStatus: pet.healthStatus,
  adoptionStatus: pet.status.toUpperCase(),
  arrivalDate: "2026-01-15",
  images: [
    {
      imageId: `mock-image-${pet.id}`,
      fileId: `mock-file-${pet.id}`,
      imageUrl: pet.image,
      uploadedAt: now(),
    },
  ],
}));

const suppliers = [
  { supplierId: "supplier-1", supplierName: "PetCo Jordan", isActive: true },
  { supplierId: "supplier-2", supplierName: "VetPharma", isActive: true },
  { supplierId: "supplier-3", supplierName: "Animal Care Co.", isActive: true },
];

let supplies = PRODUCTS.map((product) => ({
  supplyId: String(product.id),
  supplyName: product.name,
  category: product.category.toUpperCase().replace(/ /g, "_").replace(/&/g, "AND"),
  quantity: product.inStock ? 24 : 0,
  sellingPrice: product.price.toFixed(2),
  purchasePrice: Math.max(product.price * 0.65, 0).toFixed(2),
  lowStockLimit: 5,
  supplierId: suppliers[(product.id - 1) % suppliers.length].supplierId,
  supplier: suppliers[(product.id - 1) % suppliers.length],
  deliveryTimeDays: 3,
  minimumOrderQuantity: 1,
  status: product.inStock ? "AVAILABLE" : "OUT_OF_STOCK",
  lastUpdated: now(),
}));

let notifications = [
  { id: "notif-1", notificationId: "notif-1", title: "New adoption request", message: "Mochi has a new interested adopter.", type: "ADOPTION", status: "UNREAD", createdAt: now(), isRead: false },
  { id: "notif-2", notificationId: "notif-2", title: "Low stock", message: "Some store supplies are near the low stock limit.", type: "INVENTORY", status: "READ", createdAt: now(), isRead: true },
];

let adoptionRequests = [
  {
    requestId: "request-1",
    petId: "1",
    status: "PENDING",
    notes: "Demo request for frontend testing.",
    createdAt: now(),
    requestDate: now().slice(0, 10),
    pet: pets[0],
    adopter: { firstName: "Adopter", lastName: "Demo", email: "adopter@petopia.test" },
  },
];

let conversations = [
  {
    conversationId: "conversation-1",
    status: "open",
    updatedAt: now(),
    adopter: { firstName: "Adopter", lastName: "Demo" },
    assignedEmployee: { firstName: "Staff", lastName: "Demo" },
    unreadCount: 1,
    messages: [
      { messageId: "message-1", senderId: "mock-employee", message: "Hello! How can we help with your adoption?", isRead: false, createdAt: now() },
    ],
  },
];

function broadcastNotificationChange() {
  window.dispatchEvent(new CustomEvent("petopia:notifications-changed"));
}

function addNotification(title: string, message: string, type = "ADOPTION") {
  const id = `notif-${Date.now()}`;
  notifications = [
    { id, notificationId: id, title, message, type, status: "UNREAD", createdAt: now(), isRead: false },
    ...notifications,
  ];
  broadcastNotificationChange();
}

function withDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(value), 150));
}

function filterByQuery<T extends Record<string, unknown>>(items: T[], params: URLSearchParams, fields: string[]) {
  const search = params.get("search")?.toLowerCase().trim();
  if (!search) return items;
  return items.filter((item) =>
    fields.some((field) => String(item[field] ?? "").toLowerCase().includes(search)),
  );
}

function listPets(params: URLSearchParams) {
  let data = [...pets];
  data = filterByQuery(data, params, ["name", "species", "breed", "description"]);
  const species = params.get("species");
  const status = params.get("status");
  const minAge = params.get("minAge");
  const maxAge = params.get("maxAge");
  if (species) data = data.filter((pet) => pet.species.toLowerCase() === species.toLowerCase());
  if (status) data = data.filter((pet) => pet.adoptionStatus.toLowerCase() === status.toLowerCase());
  if (minAge) data = data.filter((pet) => Number(pet.age ?? 0) >= Number(minAge));
  if (maxAge) data = data.filter((pet) => Number(pet.age ?? 0) <= Number(maxAge));
  return data;
}

function listSupplies(params: URLSearchParams) {
  let data = [...supplies];
  data = filterByQuery(data, params, ["supplyName", "category"]);
  const category = params.get("category");
  if (category) data = data.filter((item) => item.category === category || item.category.toLowerCase() === category.toLowerCase());
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 10);
  const total = data.length;
  const start = (page - 1) * limit;
  return { data: data.slice(start, start + limit), total, page, limit };
}

function reportFor(type: string) {
  if (type === "pets") {
    return {
      summary: { totalPets: pets.length, available: pets.filter((p) => p.adoptionStatus === "AVAILABLE").length, pending: pets.filter((p) => p.adoptionStatus === "PENDING").length },
      data: pets.map(({ petId, name, species, breed, adoptionStatus }) => ({ petId, name, species, breed, adoptionStatus })),
    };
  }
  if (type === "inventory") {
    return {
      summary: { totalSupplies: supplies.length, lowStock: supplies.filter((s) => s.quantity <= s.lowStockLimit).length },
      data: supplies.slice(0, 10).map(({ supplyId, supplyName, category, quantity, status }) => ({ supplyId, supplyName, category, quantity, status })),
    };
  }
  return {
    summary: { totalRequests: adoptionRequests.length, pending: adoptionRequests.filter((r) => r.status === "PENDING").length },
    data: adoptionRequests.map(({ requestId, status, pet }) => ({ requestId, status, pet: pet.name, createdAt: now() })),
  };
}

export async function mockApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = new URL(path, "http://mock.local");
  const method = ((init.method ?? "GET").toUpperCase() as Method);
  const body = readBody(init);

  if (url.pathname === "/auth/login" && method === "POST") {
    const email = String(body.email ?? "adopter@petopia.test");
    localStorage.setItem("petopia_mock_email", email);
    currentProfile = mockProfile(email);
    return withDelay({
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      user: {
        id: currentProfile.userId,
        email,
        firstName: currentProfile.firstName,
        lastName: currentProfile.lastName,
        roleName: currentProfile.roleName,
      },
    } as T);
  }

  if (url.pathname === "/auth/refresh" && method === "POST") return withDelay({ accessToken: "mock-access-token", refreshToken: "mock-refresh-token" } as T);
  if (url.pathname === "/auth/logout" && method === "POST") return withDelay({ message: "Logged out" } as T);
  if (url.pathname === "/auth/signup" && method === "POST") return withDelay({ message: "Account created in mock mode" } as T);
  if (url.pathname === "/auth/forgot-password" && method === "POST") return withDelay({ message: "Mock reset link accepted" } as T);
  if (url.pathname === "/auth/reset-password" && method === "POST") return withDelay({ message: "Password reset in mock mode" } as T);
  if (url.pathname === "/auth/change-password" && method === "POST") return withDelay({ message: "Password changed in mock mode" } as T);

  if (url.pathname === "/users/profile" && method === "GET") return withDelay(currentProfile as T);
  if (url.pathname === "/users/profile" && method === "PATCH") {
    currentProfile = { ...currentProfile, ...body, updatedAt: now() };
    return withDelay(currentProfile as T);
  }
  if (url.pathname === "/users/profile/avatar" && method === "POST") return withDelay({ avatar: null } as T);

  if (url.pathname === "/pets" && method === "GET") return withDelay(listPets(url.searchParams) as T);
  if (url.pathname === "/pets" && method === "POST") {
    const next = {
      ...body,
      petId: `mock-pet-${Date.now()}`,
      name: String(body.name ?? "New pet"),
      species: String(body.species ?? "Dog"),
      breed: String(body.breed ?? "Mixed"),
      age: Number(body.age ?? 1),
      gender: (body.gender as "Male" | "Female") ?? "Male",
      color: String(body.color ?? "Brown"),
      weight: Number(body.weight ?? 10),
      description: String(body.description ?? ""),
      healthStatus: String(body.healthStatus ?? "Healthy"),
      adoptionStatus: String(body.adoptionStatus ?? "AVAILABLE"),
      arrivalDate: String(body.arrivalDate ?? now().slice(0, 10)),
      images: [],
    };
    pets = [next as unknown as typeof pets[number], ...pets];
    return withDelay(next as unknown as T);
  }
  const petMatch = url.pathname.match(/^\/pets\/([^/]+)$/);
  if (petMatch && method === "GET") return withDelay(pets.find((pet) => pet.petId === petMatch[1]) as T);
  if (petMatch && method === "PATCH") {
    const updated = pets.map((pet) => pet.petId === petMatch[1] ? { ...pet, ...body } : pet);
    pets = updated;
    return withDelay(pets.find((pet) => pet.petId === petMatch[1]) as T);
  }
  if (petMatch && method === "DELETE") {
    pets = pets.filter((pet) => pet.petId !== petMatch[1]);
    return withDelay({ success: true } as T);
  }
  if (url.pathname.match(/^\/pets\/[^/]+\/images$/) && method === "POST") return withDelay({ imageUrl: "" } as T);

  if (url.pathname === "/store/supplies" && method === "GET") return withDelay(listSupplies(url.searchParams) as T);
  if (url.pathname === "/inventory/suppliers" && method === "GET") return withDelay(suppliers as T);
  if (url.pathname === "/inventory/supplies" && method === "GET") return withDelay(listSupplies(url.searchParams) as T);
  if (url.pathname === "/inventory/supplies" && method === "POST") {
    const next = { ...body, supplyId: `mock-supply-${Date.now()}`, supplier: suppliers.find((s) => s.supplierId === body.supplierId), lastUpdated: now() };
    supplies = [next as typeof supplies[number], ...supplies];
    return withDelay(next as T);
  }
  const supplyMatch = url.pathname.match(/^\/inventory\/supplies\/([^/]+)$/);
  if (supplyMatch && method === "PATCH") {
    supplies = supplies.map((supply) => supply.supplyId === supplyMatch[1] ? { ...supply, ...body, lastUpdated: now() } : supply);
    return withDelay(supplies.find((supply) => supply.supplyId === supplyMatch[1]) as T);
  }
  if (supplyMatch && method === "DELETE") {
    supplies = supplies.filter((supply) => supply.supplyId !== supplyMatch[1]);
    return withDelay({ success: true, message: "Deleted in mock mode" } as T);
  }

  if (url.pathname === "/adoption/requests" && method === "GET") return withDelay(adoptionRequests as T);
  if (url.pathname === "/adoption/requests" && method === "POST") {
    const pet = pets.find((item) => item.petId === String(body.petId)) ?? pets[0];
    const date = now();
    const next = {
      requestId: `request-${Date.now()}`,
      petId: pet.petId,
      status: "PENDING",
      notes: String(body.notes ?? ""),
      createdAt: date,
      requestDate: date.slice(0, 10),
      pet,
      adopter: currentProfile,
    };
    adoptionRequests = [next, ...adoptionRequests];
    addNotification("Adoption request submitted", `Your request for ${pet.name} is now pending review.`);
    return withDelay(next as T);
  }
  const requestAction = url.pathname.match(/^\/adoption\/requests\/([^/]+)\/(approve|reject|cancel)$/);
  if (requestAction) {
    const status = requestAction[2] === "approve" ? "APPROVED" : requestAction[2] === "reject" ? "REJECTED" : "CANCELLED";
    adoptionRequests = adoptionRequests.map((request) => request.requestId === requestAction[1] ? { ...request, status } : request);
    const updated = adoptionRequests.find((request) => request.requestId === requestAction[1]);
    if (updated) {
      const petName = updated.pet?.name ?? "your selected pet";
      const action = requestAction[2];
      if (action === "approve") addNotification("Adoption request approved", `Good news! Your request for ${petName} was approved.`);
      if (action === "reject") addNotification("Adoption request rejected", `Your request for ${petName} was not approved this time.`);
      if (action === "cancel") addNotification("Adoption request cancelled", `Your request for ${petName} was cancelled.`);
    }
    return withDelay(updated as T);
  }
  if (url.pathname === "/adoption/adoptions" && method === "GET") {
    return withDelay(adoptionRequests.filter((request) => request.status === "APPROVED").map((request) => ({ adoptionId: request.requestId, ...request })) as T);
  }

  if (url.pathname === "/notifications" && method === "GET") return withDelay(notifications as T);
  if (url.pathname === "/notifications/unread-count" && method === "GET") return withDelay({ count: notifications.filter((n) => !n.isRead).length } as T);
  if (url.pathname === "/notifications/read-all" && method === "PATCH") {
    notifications = notifications.map((item) => ({ ...item, isRead: true, status: "READ" }));
    broadcastNotificationChange();
    return withDelay({ success: true } as T);
  }
  const notificationMatch = url.pathname.match(/^\/notifications\/([^/]+)\/read$/);
  if (notificationMatch && method === "PATCH") {
    notifications = notifications.map((item) => item.id === notificationMatch[1] ? { ...item, isRead: true, status: "READ" } : item);
    broadcastNotificationChange();
    return withDelay(notifications.find((item) => item.id === notificationMatch[1]) as T);
  }

  if (url.pathname === "/messages/conversations" && method === "GET") {
    return withDelay(conversations.map(({ messages, ...conversation }) => ({ ...conversation, lastMessage: messages[messages.length - 1] })) as T);
  }
  const conversationMatch = url.pathname.match(/^\/messages\/conversations\/([^/]+)$/);
  if (conversationMatch && method === "GET") return withDelay(conversations.find((item) => item.conversationId === conversationMatch[1]) as T);
  if (conversationMatch && method === "PATCH") {
    conversations = conversations.map((item) => item.conversationId === conversationMatch[1] ? { ...item, ...body } : item);
    return withDelay(conversations.find((item) => item.conversationId === conversationMatch[1]) as T);
  }
  if (url.pathname.match(/^\/messages\/conversations\/[^/]+\/read$/) && method === "PATCH") return withDelay({ success: true } as T);
  if (url.pathname === "/messages/send" && method === "POST") {
    const message = { messageId: `message-${Date.now()}`, senderId: currentProfile.userId, message: String(body.message ?? ""), isRead: false, createdAt: now() };
    conversations = conversations.map((item) => item.conversationId === body.conversationId ? { ...item, messages: [...item.messages, message], updatedAt: now() } : item);
    return withDelay(message as T);
  }

  const reportMatch = url.pathname.match(/^\/reports\/([^/]+)$/);
  if (reportMatch && method === "GET") return withDelay(reportFor(reportMatch[1]) as T);

  return withDelay({} as T);
}

export async function mockApiBlobFetch(path: string): Promise<Blob> {
  const type = path.includes("pdf") ? "application/pdf" : "text/csv";
  const body = type === "text/csv" ? "name,value\nmock,true\n" : "Mock PDF export";
  return withDelay(new Blob([body], { type }));
}
