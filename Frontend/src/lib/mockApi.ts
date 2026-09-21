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

let currentProfile = mockProfile(sessionStorage.getItem("petopia_mock_email") ?? undefined);

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

let departments = [
  {
    departmentId: "department-veterinary",
    departmentName: "Veterinary",
    description: "Medical care, vaccination tracking, and health checks.",
    isActive: true,
    createdAt: "2026-01-03T09:00:00.000Z",
    manager: mockProfile("manager@petopia.test"),
    employees: [] as Array<Record<string, unknown>>,
  },
  {
    departmentId: "department-operations",
    departmentName: "Operations",
    description: "Shelter operations, adoption coordination, and daily care.",
    isActive: true,
    createdAt: "2026-01-04T09:00:00.000Z",
    manager: mockProfile("admin@petopia.test"),
    employees: [] as Array<Record<string, unknown>>,
  },
  {
    departmentId: "department-customer-service",
    departmentName: "Customer Service",
    description: "Adopter support, chats, and request follow-up.",
    isActive: true,
    createdAt: "2026-01-05T09:00:00.000Z",
    manager: null,
    employees: [] as Array<Record<string, unknown>>,
  },
];

let supplies = PRODUCTS.map((product) => ({
  supplyId: String(product.id),
  productId: String(product.id),
  supplyName: product.name,
  category: product.category.toUpperCase().replace(/ /g, "_").replace(/&/g, "AND"),
  quantity: product.inStock ? 24 : 0,
  sellingPrice: product.price.toFixed(2),
  purchasePrice: Math.max(product.price * 0.65, 0).toFixed(2),
  isActive: true,
  storeListed: true,
  lowStockLimit: 5,
  supplierId: suppliers[(product.id - 1) % suppliers.length].supplierId,
  supplier: suppliers[(product.id - 1) % suppliers.length],
  deliveryTimeDays: 3,
  minimumOrderQuantity: 1,
  status: product.inStock ? "AVAILABLE" : "OUT_OF_STOCK",
  lastUpdated: now(),
}));

let mockCartItems: Array<{ productId: string; quantity: number }> = [];
let mockOrders: Array<Record<string, unknown>> = [
  {
    orderId: "mock-order-demo",
    userId: "mock-adopter",
    totalPrice: "31.48",
    recipientName: "Adopter Demo",
    phoneNumber: "+962-6-5001234",
    addressLine: "Rainbow Street",
    city: "Amman",
    postalCode: null,
    deliveryNotes: "Leave at reception.",
    orderStatus: "COMPLETED",
    createdAt: now(),
    updatedAt: now(),
    user: { firstName: "Adopter", lastName: "Demo", email: "adopter@petopia.test" },
    orderItems: [
      {
        orderItemId: "mock-order-item-demo-1",
        orderId: "mock-order-demo",
        productId: String(PRODUCTS[0].id),
        quantity: 1,
        unitPrice: PRODUCTS[0].price.toFixed(2),
        subtotal: PRODUCTS[0].price.toFixed(2),
        product: { productName: PRODUCTS[0].name },
      },
      {
        orderItemId: "mock-order-item-demo-2",
        orderId: "mock-order-demo",
        productId: String(PRODUCTS[1].id),
        quantity: 5,
        unitPrice: PRODUCTS[1].price.toFixed(2),
        subtotal: (PRODUCTS[1].price * 5).toFixed(2),
        product: { productName: PRODUCTS[1].name },
      },
    ],
    payments: [{
      paymentId: "mock-payment-demo",
      orderId: "mock-order-demo",
      amount: "31.48",
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      paidAt: now(),
      createdAt: now(),
      updatedAt: now(),
    }],
  },
];

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

let users = [
  mockProfile("admin@petopia.test"),
  mockProfile("manager@petopia.test"),
  mockProfile("staff@petopia.test"),
  mockProfile("vet@petopia.test"),
  mockProfile("adopter@petopia.test"),
].map((user, index) => ({
  ...user,
  status: "active",
  createdAt: `2026-0${Math.min(index + 1, 9)}-10T09:00:00.000Z`,
  role: { roleId: `role-${user.roleName.toLowerCase()}`, roleName: user.roleName },
  employeeProfile: user.roleName === "ADOPTER" ? null : {
    departmentId: "department-operations",
    department: { departmentId: "department-operations", departmentName: "Operations" },
    salary: "700.00",
    hireDate: "2026-01-10",
    address: "Amman",
  },
}));

departments = departments.map((department) => ({
  ...department,
  employees: users
    .filter((user) => user.employeeProfile?.departmentId === department.departmentId)
    .map((user) => ({
      employeeId: `employee-${user.userId}`,
      userId: user.userId,
      user,
    })),
}));

let medicalEntries = [
  {
    entryId: "medical-entry-1",
    diagnosis: "Routine exam",
    treatment: "Healthy, continue standard care",
    vaccinationStatus: "VACCINATED",
    medicalDate: "2026-07-10",
    notes: "Demo medical entry",
    veterinarian: { firstName: "Vet", lastName: "Demo" },
  },
];

let vaccinations = [
  {
    vaccinationId: "vaccination-1",
    vaccineName: "Rabies",
    vaccinationDate: "2026-07-10",
    nextDueDate: "2027-07-10",
    status: "VACCINATED",
    notes: "Demo vaccination",
    pet: { name: pets[0].name, species: pets[0].species },
    veterinarian: { firstName: "Vet", lastName: "Demo" },
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
  const sortBy = params.get("sortBy") ?? "createdAt";
  const order = params.get("order") === "ASC" ? "ASC" : "DESC";
  if (species) data = data.filter((pet) => pet.species.toLowerCase() === species.toLowerCase());
  if (status) data = data.filter((pet) => pet.adoptionStatus.toLowerCase() === status.toLowerCase());
  if (minAge) data = data.filter((pet) => Number(pet.age ?? 0) >= Number(minAge));
  if (maxAge) data = data.filter((pet) => Number(pet.age ?? 0) <= Number(maxAge));
  data.sort((a, b) => {
    const left = sortBy === "age" ? Number(a.age ?? 0) : String(a[sortBy as keyof typeof a] ?? "");
    const right = sortBy === "age" ? Number(b.age ?? 0) : String(b[sortBy as keyof typeof b] ?? "");
    const result = typeof left === "number" && typeof right === "number"
      ? left - right
      : String(left).localeCompare(String(right));
    return order === "ASC" ? result : -result;
  });

  const page = Math.max(1, Number(params.get("page") ?? 1));
  const limit = Math.max(1, Number(params.get("limit") ?? 12));
  const total = data.length;
  const start = (page - 1) * limit;
  return { data: data.slice(start, start + limit), total, page, limit };
}

function listSupplies(params: URLSearchParams) {
  let data = supplies.filter((item) => item.isActive !== false);
  data = filterByQuery(data, params, ["supplyName", "category"]);
  const category = params.get("category");
  if (category) data = data.filter((item) => item.category === category || item.category.toLowerCase() === category.toLowerCase());
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 10);
  const total = data.length;
  const start = (page - 1) * limit;
  return { data: data.slice(start, start + limit), total, page, limit };
}

function listStoreSupplies(params: URLSearchParams) {
  const storeParams = new URLSearchParams(params);
  let data = supplies.filter(
    (item) =>
      item.isActive !== false &&
      item.storeListed !== false &&
      item.status === "AVAILABLE" &&
      item.quantity > 0,
  );
  data = filterByQuery(data, storeParams, ["supplyName", "category"]);
  const category = storeParams.get("category");
  if (category) data = data.filter((item) => item.category === category || item.category.toLowerCase() === category.toLowerCase());
  const page = Number(storeParams.get("page") ?? 1);
  const limit = Number(storeParams.get("limit") ?? 10);
  const total = data.length;
  const start = (page - 1) * limit;
  return { data: data.slice(start, start + limit), total, page, limit };
}

function supplyForProduct(productId: string) {
  return supplies.find(
    (item) =>
      String(item.productId) === productId &&
      item.isActive !== false &&
      item.storeListed !== false &&
      item.status === "AVAILABLE" &&
      Number(item.quantity ?? 0) > 0,
  );
}

function mockCartResponse() {
  return {
    cartId: `mock-cart-${currentProfile.userId}`,
    userId: currentProfile.userId,
    cartItems: mockCartItems.map((item) => {
      const supply = supplies.find((row) => String(row.productId) === item.productId);
      const unitPrice = Number(supply?.sellingPrice ?? 0);
      const productName = String(supply?.supplyName ?? "Store item");
      return {
        cartItemId: `mock-cart-item-${item.productId}`,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice.toFixed(2),
        subtotal: (unitPrice * item.quantity).toFixed(2),
        product: {
          productId: item.productId,
          productName,
          unitPrice: unitPrice.toFixed(2),
          isActive: supply?.isActive !== false,
        },
      };
    }),
  };
}

function mockOrderFromBody(orderId: string, body: Record<string, unknown>, status = "PENDING") {
  const cart = mockCartResponse();
  const total = cart.cartItems.reduce((sum, item) => sum + Number(item.subtotal), 0);
  return {
    orderId,
    userId: currentProfile.userId,
    totalPrice: total.toFixed(2),
    recipientName: String(body.recipientName ?? ""),
    phoneNumber: String(body.phoneNumber ?? ""),
    addressLine: String(body.addressLine ?? ""),
    city: String(body.city ?? ""),
    postalCode: body.postalCode ? String(body.postalCode) : null,
    deliveryNotes: body.deliveryNotes ? String(body.deliveryNotes) : null,
    orderStatus: status,
    createdAt: now(),
    updatedAt: now(),
    orderItems: cart.cartItems.map((item) => ({
      orderItemId: `mock-order-item-${item.productId}`,
      orderId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      product: item.product,
    })),
    user: { firstName: currentProfile.firstName, lastName: currentProfile.lastName, email: currentProfile.email },
    payments: status === "COMPLETED" ? [{
      paymentId: `mock-payment-${orderId}`,
      orderId,
      amount: total.toFixed(2),
      paymentMethod: "CASH",
      paymentStatus: "PAID",
      paidAt: now(),
      createdAt: now(),
      updatedAt: now(),
    }] : [],
  };
}

function reportFor(type: string) {
  if (type === "pets") {
    return {
      summary: {
        totalPets: pets.length,
        available: pets.filter((p) => p.adoptionStatus === "AVAILABLE").length,
        pendingAdoption: pets.filter((p) => p.adoptionStatus === "PENDING").length,
        adopted: pets.filter((p) => p.adoptionStatus === "ADOPTED").length,
        medicalCare: 0,
      },
      data: pets.map(({ name, species, breed, age, adoptionStatus, healthStatus }) => ({ pet: name, species, breed, age, status: adoptionStatus, health: healthStatus })),
    };
  }
  if (type === "inventory") {
    return {
      summary: {
        totalItems: supplies.length,
        lowStock: supplies.filter((s) => s.quantity <= s.lowStockLimit).length,
        outOfStock: supplies.filter((s) => s.quantity === 0).length,
        totalSuppliers: suppliers.length,
        inventoryValue: "0.00 JD",
      },
      data: supplies.slice(0, 10).map(({ supplyName, category, quantity, lowStockLimit, status }) => ({
        supply: supplyName,
        category,
        quantity,
        minimum: lowStockLimit,
        status,
        supplier: suppliers[0]?.supplierName ?? "",
        inventoryValue: "0.00",
      })),
    };
  }
  const statusCounts = adoptionRequests.reduce<Record<string, number>>((acc, request) => {
    acc[request.status] = (acc[request.status] ?? 0) + 1;
    return acc;
  }, {});
  return {
    summary: {
      totalRequests: adoptionRequests.length,
      approved: statusCounts.APPROVED ?? 0,
      pending: statusCounts.PENDING ?? 0,
      rejected: statusCounts.REJECTED ?? 0,
      cancelled: (statusCounts.CANCELED ?? 0) + (statusCounts.CANCELLED ?? 0),
      approvalRate: adoptionRequests.length ? `${Math.round(((statusCounts.APPROVED ?? 0) / adoptionRequests.length) * 100)}%` : "0%",
    },
    data: adoptionRequests.map(({ requestId, status, pet, requestDate, adopter }) => ({
      adoptionId: requestId,
      pet: pet.name,
      species: pet.species,
      breed: pet.breed,
      adopter: `${adopter.firstName} ${adopter.lastName}`,
      requestDate,
      approvalDate: status === "APPROVED" ? requestDate : "",
      status,
      approvedBy: status === "APPROVED" ? "Mock Manager" : "",
    })),
  };
}

export async function mockApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = new URL(path, "http://mock.local");
  const method = ((init.method ?? "GET").toUpperCase() as Method);
  const body = readBody(init);

  if (url.pathname === "/auth/login" && method === "POST") {
    const email = String(body.email ?? "adopter@petopia.test");
    sessionStorage.setItem("petopia_mock_email", email);
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
  if (url.pathname === "/users" && method === "GET") {
    const status = url.searchParams.get("status") ?? "active";
    const data = status === "all" ? users : users.filter((user) => user.status === status);
    return withDelay(data as T);
  }
  const userMatch = url.pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === "GET") return withDelay(users.find((user) => user.userId === userMatch[1]) as T);
  const userAvatarMatch = url.pathname.match(/^\/users\/([^/]+)\/avatar$/);
  if (userAvatarMatch && method === "POST") {
    const avatarFile = init.body instanceof FormData ? init.body.get("file") : null;
    const avatar = avatarFile instanceof File ? URL.createObjectURL(avatarFile) : null;
    users = users.map((user) => user.userId === userAvatarMatch[1] ? { ...user, avatar, updatedAt: now() } : user);
    return withDelay(users.find((user) => user.userId === userAvatarMatch[1]) as T);
  }
  if (userMatch && method === "PATCH") {
    users = users.map((user) => {
      if (user.userId !== userMatch[1]) return user;
      const role = body.roleId ? users.find((item) => item.role.roleId === body.roleId)?.role ?? user.role : user.role;
      return { ...user, ...body, role, updatedAt: now() };
    });
    return withDelay(users.find((user) => user.userId === userMatch[1]) as T);
  }
  if (userMatch && method === "DELETE") {
    users = users.map((user) => user.userId === userMatch[1] ? { ...user, status: "inactive", updatedAt: now() } : user);
    return withDelay({ message: "User deactivated in mock mode" } as T);
  }

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
  const petFullMatch = url.pathname.match(/^\/pets\/([^/]+)\/full$/);
  if (petFullMatch && method === "GET") {
    const pet = pets.find((item) => item.petId === petFullMatch[1]);
    return withDelay({ ...pet, medicalRecord: { recordId: "medical-record-1", createdAt: now() }, vaccinations } as T);
  }
  const petMedicalMatch = url.pathname.match(/^\/pets\/([^/]+)\/medical-record$/);
  if (petMedicalMatch && method === "GET") {
    const pet = pets.find((item) => item.petId === petMedicalMatch[1]) ?? pets[0];
    return withDelay({ pet, entries: medicalEntries } as T);
  }
  const petMedicalCreateMatch = url.pathname.match(/^\/pets\/([^/]+)\/medical-record\/entries$/);
  if (petMedicalCreateMatch && method === "POST") {
    const next = { entryId: `medical-entry-${Date.now()}`, ...body, veterinarian: { firstName: "Vet", lastName: "Demo" } };
    medicalEntries = [next as typeof medicalEntries[number], ...medicalEntries];
    return withDelay(next as T);
  }
  const medicalEntryMatch = url.pathname.match(/^\/medical-entries\/([^/]+)$/);
  if (medicalEntryMatch && method === "PATCH") {
    medicalEntries = medicalEntries.map((entry) => entry.entryId === medicalEntryMatch[1] ? { ...entry, ...body } : entry);
    return withDelay(medicalEntries.find((entry) => entry.entryId === medicalEntryMatch[1]) as T);
  }
  if (medicalEntryMatch && method === "DELETE") {
    medicalEntries = medicalEntries.filter((entry) => entry.entryId !== medicalEntryMatch[1]);
    return withDelay({ message: "Medical entry deleted in mock mode" } as T);
  }
  const petVaccinationsMatch = url.pathname.match(/^\/pets\/([^/]+)\/vaccinations$/);
  if (petVaccinationsMatch && method === "GET") return withDelay(vaccinations as T);
  if (petVaccinationsMatch && method === "POST") {
    const pet = pets.find((item) => item.petId === petVaccinationsMatch[1]) ?? pets[0];
    const next = {
      vaccinationId: `vaccination-${Date.now()}`,
      ...body,
      pet: { name: pet.name, species: pet.species },
      veterinarian: { firstName: "Vet", lastName: "Demo" },
    };
    vaccinations = [next as typeof vaccinations[number], ...vaccinations];
    return withDelay(next as T);
  }
  const vaccinationMatch = url.pathname.match(/^\/vaccinations\/([^/]+)$/);
  if (vaccinationMatch && method === "PATCH") {
    vaccinations = vaccinations.map((item) => item.vaccinationId === vaccinationMatch[1] ? { ...item, ...body } : item);
    return withDelay(vaccinations.find((item) => item.vaccinationId === vaccinationMatch[1]) as T);
  }
  if (vaccinationMatch && method === "DELETE") {
    vaccinations = vaccinations.filter((item) => item.vaccinationId !== vaccinationMatch[1]);
    return withDelay({ message: "Vaccination deleted in mock mode" } as T);
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

  if (url.pathname === "/store/supplies" && method === "GET") return withDelay(listStoreSupplies(url.searchParams) as T);
  if (url.pathname === "/store/supplies" && method === "POST") {
    const next = {
      ...body,
      supplyId: `mock-supply-${Date.now()}`,
      productId: `mock-product-${Date.now()}`,
      supplier: suppliers.find((s) => s.supplierId === body.supplierId),
      isActive: true,
      storeListed: body.storeListed !== false,
      lastUpdated: now(),
    };
    supplies = [next as typeof supplies[number], ...supplies];
    return withDelay(next as T);
  }
  const storeSupplyMatch = url.pathname.match(/^\/store\/supplies\/([^/]+)$/);
  if (storeSupplyMatch && method === "GET") {
    const supply = supplies.find(
      (item) =>
        item.supplyId === storeSupplyMatch[1] &&
        item.isActive !== false &&
        item.storeListed !== false &&
        item.status === "AVAILABLE" &&
        item.quantity > 0,
    );
    return withDelay(supply as T);
  }
  if (storeSupplyMatch && method === "PATCH") {
    supplies = supplies.map((supply) => supply.supplyId === storeSupplyMatch[1] ? { ...supply, ...body, lastUpdated: now() } : supply);
    return withDelay(supplies.find((supply) => supply.supplyId === storeSupplyMatch[1]) as T);
  }
  if (storeSupplyMatch && method === "DELETE") {
    supplies = supplies.map((supply) => supply.supplyId === storeSupplyMatch[1] ? { ...supply, storeListed: false, lastUpdated: now() } : supply);
    return withDelay({ success: true, message: "Deactivated from store in mock mode" } as T);
  }
  if (url.pathname === "/inventory/suppliers" && method === "GET") return withDelay(suppliers as T);

  if (url.pathname === "/cart/me" && method === "GET") return withDelay(mockCartResponse() as T);
  if (url.pathname === "/cart/items" && method === "POST") {
    const productId = String(body.productId ?? "");
    const quantity = Number(body.quantity ?? 1);
    const supply = supplyForProduct(productId);
    if (!supply) throw new Error("Product is out of stock.");
    const existing = mockCartItems.find((item) => item.productId === productId);
    if (existing) existing.quantity += quantity;
    else mockCartItems = [...mockCartItems, { productId, quantity }];
    return withDelay(mockCartResponse() as T);
  }
  const cartItemMatch = url.pathname.match(/^\/cart\/items\/([^/]+)$/);
  if (cartItemMatch && method === "PATCH") {
    const productId = cartItemMatch[1];
    const quantity = Number(body.quantity ?? 1);
    mockCartItems = mockCartItems.map((item) => item.productId === productId ? { ...item, quantity } : item);
    return withDelay(mockCartResponse() as T);
  }
  if (cartItemMatch && method === "DELETE") {
    mockCartItems = mockCartItems.filter((item) => item.productId !== cartItemMatch[1]);
    return withDelay(mockCartResponse() as T);
  }
  if (url.pathname === "/cart/me" && method === "DELETE") {
    mockCartItems = [];
    return withDelay({ success: true, message: "Cart deleted successfully" } as T);
  }

  if (url.pathname === "/orders" && method === "GET") return withDelay(mockOrders as T);
  if (url.pathname === "/orders/me" && method === "GET") return withDelay(mockOrders.filter(order => order.userId === currentProfile.userId) as T);
  const ownOrderMatch = url.pathname.match(/^\/orders\/me\/([^/]+)$/);
  if (ownOrderMatch && method === "GET") {
    const order = mockOrders.find(order => order.orderId === ownOrderMatch[1] && order.userId === currentProfile.userId);
    if (!order) throw new Error("Order not found");
    return withDelay(order as T);
  }

  if (url.pathname === "/checkout" && method === "POST") {
    if (mockCartItems.length === 0) throw new Error("Cannot checkout with an empty cart");
    const order = mockOrderFromBody(crypto.randomUUID(), body);
    mockOrders = [order, ...mockOrders];
    return withDelay(order as T);
  }
  const checkoutActionMatch = url.pathname.match(/^\/checkout\/([^/]+)\/(pay|cancel)$/);
  if (checkoutActionMatch && method === "POST") {
    const existing = mockOrders.find(order => order.orderId === checkoutActionMatch[1] && order.userId === currentProfile.userId);
    if (!existing) throw new Error("Order not found");
    if (existing.orderStatus !== "PENDING") throw new Error("Only pending orders can be paid or canceled");
    const paid = checkoutActionMatch[2] === "pay";
    const updated = {
      ...existing,
      orderStatus: paid ? "COMPLETED" : "CANCELED",
      payments: paid ? [{
        paymentId: crypto.randomUUID(), orderId: existing.orderId, amount: existing.totalPrice,
        paymentMethod: "CASH", paymentStatus: "PAID", paidAt: now(), createdAt: now(), updatedAt: now(),
      }] : existing.payments,
      updatedAt: now(),
    };
    mockOrders = mockOrders.map(order => order.orderId === existing.orderId ? updated : order);
    if (paid) mockCartItems = [];
    return withDelay(updated as T);
  }
  if (url.pathname === "/inventory/suppliers" && method === "POST") {
    const next = { ...body, supplierId: `mock-supplier-${Date.now()}`, isActive: true, supplies: [] };
    suppliers.unshift(next as typeof suppliers[number]);
    return withDelay(next as T);
  }
  const supplierMatch = url.pathname.match(/^\/inventory\/suppliers\/([^/]+)$/);
  if (supplierMatch && method === "GET") {
    const supplier = suppliers.find((item) => item.supplierId === supplierMatch[1]);
    return withDelay({ ...supplier, supplies: supplies.filter((item) => item.supplierId === supplierMatch[1]) } as T);
  }
  if (supplierMatch && method === "PATCH") {
    const index = suppliers.findIndex((supplier) => supplier.supplierId === supplierMatch[1]);
    if (index >= 0) suppliers[index] = { ...suppliers[index], ...body };
    return withDelay(suppliers[index] as T);
  }
  if (supplierMatch && method === "DELETE") {
    const index = suppliers.findIndex((supplier) => supplier.supplierId === supplierMatch[1]);
    if (index >= 0) suppliers[index] = { ...suppliers[index], isActive: false };
    return withDelay({ success: true, message: "Supplier deleted in mock mode" } as T);
  }
  if (url.pathname === "/inventory/supplies" && method === "GET") return withDelay(listSupplies(url.searchParams) as T);
  if (url.pathname === "/inventory/supplies" && method === "POST") {
    const next = {
      ...body,
      supplyId: `mock-supply-${Date.now()}`,
      productId: `mock-product-${Date.now()}`,
      supplier: suppliers.find((s) => s.supplierId === body.supplierId),
      isActive: true,
      storeListed: body.storeListed !== false,
      lastUpdated: now(),
    };
    supplies = [next as typeof supplies[number], ...supplies];
    return withDelay(next as T);
  }
  const supplyMatch = url.pathname.match(/^\/inventory\/supplies\/([^/]+)$/);
  if (supplyMatch && method === "PATCH") {
    supplies = supplies.map((supply) => supply.supplyId === supplyMatch[1] ? { ...supply, ...body, lastUpdated: now() } : supply);
    return withDelay(supplies.find((supply) => supply.supplyId === supplyMatch[1]) as T);
  }
  if (supplyMatch && method === "DELETE") {
    supplies = supplies.map((supply) => supply.supplyId === supplyMatch[1] ? { ...supply, isActive: false, storeListed: false, lastUpdated: now() } : supply);
    return withDelay({ success: true, message: "Deleted in mock mode" } as T);
  }

  if (url.pathname === "/departments" && method === "GET") {
    const activeOnly = url.searchParams.get("active") === "true";
    const rows = activeOnly ? departments.filter((department) => department.isActive !== false) : departments;
    return withDelay(rows as T);
  }
  if (url.pathname === "/departments" && method === "POST") {
    const departmentName = String(body.departmentName ?? "").trim();
    if (!departmentName) throw new Error("Department name cannot be blank");
    if (departments.some((department) => department.departmentName.trim().toLowerCase() === departmentName.toLowerCase())) {
      throw new Error("Department name already exists");
    }
    const next = {
      departmentId: `mock-department-${Date.now()}`,
      departmentName,
      description: typeof body.description === "string" ? body.description : null,
      isActive: true,
      createdAt: now(),
      manager: null,
      employees: [] as Array<Record<string, unknown>>,
    };
    departments = [next, ...departments];
    return withDelay(next as T);
  }
  const departmentMatch = url.pathname.match(/^\/departments\/([^/]+)$/);
  if (departmentMatch && method === "GET") {
    const department = departments.find((item) => item.departmentId === departmentMatch[1]);
    return withDelay(department as T);
  }
  if (departmentMatch && method === "PATCH") {
    const departmentName = typeof body.departmentName === "string" ? body.departmentName.trim() : undefined;
    if (departmentName !== undefined && !departmentName) throw new Error("Department name cannot be blank");
    if (
      departmentName &&
      departments.some((department) => department.departmentId !== departmentMatch[1] && department.departmentName.trim().toLowerCase() === departmentName.toLowerCase())
    ) {
      throw new Error("Department name already exists");
    }
    departments = departments.map((department) => department.departmentId === departmentMatch[1] ? {
      ...department,
      ...body,
      ...(departmentName === undefined ? {} : { departmentName }),
    } : department);
    return withDelay(departments.find((department) => department.departmentId === departmentMatch[1]) as T);
  }
  if (departmentMatch && method === "DELETE") {
    const department = departments.find((item) => item.departmentId === departmentMatch[1]);
    if (department && department.employees.length > 0) throw new Error("Move or remove department users before deleting the department");
    departments = departments.map((item) => item.departmentId === departmentMatch[1] ? { ...item, isActive: false } : item);
    return withDelay({ success: true, message: "Department deleted in mock mode" } as T);
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
  if (url.pathname === "/dashboard/admin" && method === "GET") {
    return withDelay({
      users: { total: users.length, admin: 1, manager: 1, employee: 1, vet: 1, adopter: 1, active: users.filter((user) => user.status === "ACTIVE").length, inactive: users.filter((user) => user.status !== "ACTIVE").length },
      pets: { total: pets.length, available: pets.filter((pet) => pet.adoptionStatus === "AVAILABLE").length, adopted: pets.filter((pet) => pet.adoptionStatus === "ADOPTED").length, pendingAdoption: pets.filter((pet) => pet.adoptionStatus === "PENDING").length, addedRecently: pets.length },
      adoptions: { totalRequests: adoptionRequests.length, pending: adoptionRequests.filter((request) => request.status === "PENDING").length, approved: adoptionRequests.filter((request) => request.status === "APPROVED").length, rejectedOrCanceled: adoptionRequests.filter((request) => ["REJECTED", "CANCELED", "CANCELLED"].includes(request.status)).length },
      medical: { totalMedicalRecords: 1, totalVaccinations: vaccinations.length, petsNeedingMedicalAttention: 0 },
      supplies: { totalSupplies: supplies.length, availableSupplies: supplies.filter((supply) => supply.quantity > 0).length, lowStockSupplies: supplies.filter((supply) => supply.quantity <= supply.lowStockLimit).length, totalSuppliers: suppliers.length },
      activity: { recentActivityLogs: [{ logId: "log-1", action: "Mock dashboard loaded", entityType: "dashboard", createdAt: now(), user: null }] },
    } as T);
  }
  if (url.pathname === "/dashboard/manager" && method === "GET") {
    return withDelay({
      users: { total: 3, employee: 1, vet: 1, adopter: 1 },
      pets: { total: pets.length, available: pets.filter((pet) => pet.adoptionStatus === "AVAILABLE").length, adopted: 0, pendingAdoption: 0 },
      adoptions: { totalRequests: adoptionRequests.length, pending: adoptionRequests.filter((request) => request.status === "PENDING").length, approved: adoptionRequests.filter((request) => request.status === "APPROVED").length, rejectedOrCanceled: adoptionRequests.filter((request) => ["REJECTED", "CANCELED", "CANCELLED"].includes(request.status)).length },
      medical: { totalMedicalRecords: 1, totalVaccinations: vaccinations.length },
      supplies: { availableSupplies: supplies.filter((supply) => supply.quantity > 0).length, lowStockSupplies: supplies.filter((supply) => supply.quantity <= supply.lowStockLimit).length, totalSuppliers: suppliers.length },
      activity: { recentActivityLogs: [{ logId: "log-2", action: "Mock manager dashboard loaded", entityType: "dashboard", createdAt: now(), user: null }] },
    } as T);
  }
  if (url.pathname === "/dashboard/user-activity" && method === "GET") {
    return withDelay({
      filters: { from: "2026-08-18T00:00:00.000Z", to: now(), limit: Number(url.searchParams.get("limit") ?? 10) },
      summary: { totalActivities: 42, uniqueActiveUsers: 5, averageActivitiesPerActiveUser: 8.4 },
      trend: [
        { date: "2026-09-11", count: 4, uniqueUsers: 2 },
        { date: "2026-09-12", count: 7, uniqueUsers: 3 },
        { date: "2026-09-13", count: 5, uniqueUsers: 2 },
        { date: "2026-09-14", count: 10, uniqueUsers: 4 },
        { date: "2026-09-15", count: 16, uniqueUsers: 5 },
      ],
      actions: [
        { name: "LOGIN", count: 18 },
        { name: "PET_CREATED", count: 8 },
        { name: "ADOPTION_REQUEST_APPROVED", count: 5 },
      ],
      entities: [
        { name: "USER", count: 18 },
        { name: "PET", count: 13 },
        { name: "ADOPTION_REQUEST", count: 11 },
      ],
      topUsers: users.slice(0, 5).map((user, index) => ({
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        activityCount: 10 - index,
      })),
    } as T);
  }

  return withDelay({} as T);
}

export async function mockApiBlobFetch(path: string): Promise<Blob> {
  const type = path.includes("pdf") ? "application/pdf" : "text/csv";
  const body = type === "text/csv" ? "name,value\nmock,true\n" : "Mock PDF export";
  return withDelay(new Blob([body], { type }));
}
