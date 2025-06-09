import AdminCard from '@/components/AdminCard';
import RecentActivity from '@/components/RecentActivity';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import connectDB from '@/lib/mongodb';
import AdminLayout from '@/components/AdminLayout';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  await connectDB();

  const [userCount, transactionCount, pendingDeposits, activeUsers] = await Promise.all([
    User.countDocuments(),
    Transaction.countDocuments(),
    Transaction.countDocuments({ type: 'deposit', status: 'pending' }),
    User.countDocuments({ status: 'active' })
  ]);

  const stats = [
    { title: 'Total Users', value: userCount, change: '+12%', icon: '👥', color: 'bg-blue-500' },
    { title: 'Transactions', value: transactionCount, change: '+24%', icon: '💸', color: 'bg-green-500' },
    { title: 'Pending Deposits', value: pendingDeposits, change: '+3%', icon: '⏳', color: 'bg-yellow-500' },
    { title: 'Active Users', value: activeUsers, change: '+8%', icon: '👤', color: 'bg-purple-500' },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <AdminCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All
              </button>
            </div>
            <RecentActivity />
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition">
                <span className="mr-3 text-blue-600">➕</span>
                <span className="font-medium text-gray-700">Create New User</span>
              </button>
              <button className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition">
                <span className="mr-3 text-green-600">💳</span>
                <span className="font-medium text-gray-700">Approve Transactions</span>
              </button>
              <button className="w-full flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition">
                <span className="mr-3 text-purple-600">📊</span>
                <span className="font-medium text-gray-700">Generate Reports</span>
              </button>
              <button className="w-full flex items-center p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition">
                <span className="mr-3 text-yellow-600">🔔</span>
                <span className="font-medium text-gray-700">Send Notifications</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}