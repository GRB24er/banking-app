// src/types/user.ts
export interface UserType {
  _id: string;  // MongoDB uses _id
  id: string;   // Your application might use both
  name: string;
  email: string;
  role: string;
  balance: number;
}