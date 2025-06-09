import React from 'react';

const RecentActivity = () => {
  const activities = [
    { user: 'Alex Johnson', action: 'deposit', amount: '$1,200', time: '2 min ago', status: 'pending' },
    { user: 'Sarah Williams', action: 'withdrawal', amount: '$850', time: '15 min ago', status: 'completed' },
    { user: 'Michael Brown', action: 'transfer', amount: '$500', time: '1 hour ago', status: 'completed' },
    { user: 'Emma Davis', action: 'wire transfer', amount: '$3,400', time: '3 hours ago', status: 'pending' },
    { user: 'James Wilson', action: 'account creation', amount: '', time: '5 hours ago', status: 'completed' },
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch(action) {
      case 'deposit': return '⬇️';
      case 'withdrawal': return '⬆️';
      case 'transfer': return '⇄';
      case 'wire transfer': return '🌐';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-start">
          <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <span className="text-lg">{getActionIcon(activity.action)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between">
              <p className="font-medium text-gray-900 truncate">
                {activity.user}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                {activity.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} 
              {activity.amount && ` • ${activity.amount}`}
            </p>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
            {activity.time}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;