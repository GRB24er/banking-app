'use client';

interface UserManagementProps {
  users: any[];
  refreshUsers: () => void;
  onVerifyUser: (userId: string) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export default function UserManagement({
  users,
  refreshUsers,
  onVerifyUser,
  onDeleteUser
}: UserManagementProps) {
  return (
    <div className="user-management">
      <h2>User Management</h2>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>${user.balance.toFixed(2)}</td>
                <td>
                  <span className={`status ${user.verified ? 'verified' : 'unverified'}`}>
                    {user.verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="actions">
                  {!user.verified && (
                    <button 
                      onClick={() => onVerifyUser(user._id)}
                      className="verify-btn"
                    >
                      Verify
                    </button>
                  )}
                  <button 
                    onClick={() => onDeleteUser(user._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}