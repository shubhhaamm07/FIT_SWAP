export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  role: string;
};
export type Gym = {
  id: string;
  name: string;
  city: string;
  state: string;
  description?: string;
  address?: string;
  status: string;
  images?: { imageUrl: string; isPrimary?: boolean }[];
  plans?: Plan[];
};
export type Plan = {
  id: string;
  name: string;
  price: number | string;
  durationInDays?: number;
  durationDays?: number;
  duration?: number;
  gym: Gym;
  freezeAllowed?: boolean;
  transferable?: boolean;
  transferFee?: number | string;
  allowCashTransfer?: boolean;
  allowOnlinePayment?: boolean;
  requiresGymApproval?: boolean;
};
export type Membership = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  plan: Plan;
};
export type Listing = {
  id: string;
  askingPrice: number | string;
  status: string;
  membership: Membership;
  seller?: { firstName: string; lastName: string };
};
export type Notice = {
  id: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
};
export type Transfer = {
  id: string;
  status: string;
  listing: Listing;
  createdAt: string;
};
export type Dashboard = {
  stats: {
    memberships: { active: number };
    transfers: { pending: number };
    notifications: { unread: number };
  };
  memberships: Membership[];
  listings: Listing[];
  gyms: Gym[];
};
export type Envelope<T> = {
  success: boolean;
  data: T;
  pagination?: { hasNextPage: boolean; total: number };
};
