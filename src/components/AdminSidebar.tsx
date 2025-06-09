'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const AdminSidebar = () => {
  const pathname = usePathname();
  const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Manage Users', href: '/admin/users', icon: '👥' },
    { name: 'Deposits', href: '/admin/deposits', icon: '⬇️' },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: '⬆️' },
    { name: 'Money Transfers', href: '/admin/transfers', icon: '💸' },
    { name: 'Wire Transfers', href: '/admin/wire-transfers', icon: '🌐' },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Bank Admin</h1>
      </div>
      <nav className="mt-5">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name} className="mb-1">
              <Link
                href={item.href}
                className={`flex items-center p-3 hover:bg-gray-700 ${
                  pathname === item.href ? 'bg-gray-700' : ''
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
          <li className="mt-4 border-t border-gray-700 pt-4">
            <button
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
              className="w-full text-left p-3 hover:bg-gray-700 flex items-center"
            >
              <span className="mr-2">🚪</span> Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;