const UserRow = ({ user }: { user: any }) => {
  const statusColor = user.status === 'active' 
    ? 'bg-green-100 text-green-800' 
    : user.status === 'suspended'
      ? 'bg-red-100 text-red-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500">
              ID: {user._id.toString().slice(-6)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${user.balance?.toLocaleString() || '0.00'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
        <button className="text-yellow-600 hover:text-yellow-900 mr-3">Edit</button>
        <button className="text-red-600 hover:text-red-900">Suspend</button>
      </td>
    </tr>
  );
};

export default UserRow;