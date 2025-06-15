declare module '@/lib/constants' {
  export const OWNER_EMAIL: string;
}

declare module '@/models/User' {
  const User: any;
  export default User;
}

declare module '@/models/Transaction' {
  const Transaction: any;
  export default Transaction;
}

declare module '@/lib/mongodb' {
  const dbConnect: () => Promise<void>;
  export default dbConnect;
}

declare module '@/lib/mail' {
  const transporter: any;
  export default transporter;
}

// src/types/global.d.ts
declare type UserType = {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: number;
};