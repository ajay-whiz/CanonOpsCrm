export type PaymentRequest = {
  id: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
};

export type AsanaTask = {
  id: string;
  name: string;
  completed: boolean;
  dueOn: string | null;
};

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
};

export type QBOVendor = {
  id: string;
  name: string;
  email: string;
  phone: string;
};