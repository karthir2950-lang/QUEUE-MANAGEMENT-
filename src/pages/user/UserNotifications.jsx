import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const UserNotifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type) => {
    if (type === 'APPOINTMENT' || type === 'CHECK_IN') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (type === 'QUEUE' || type === 'REMINDER') return <Clock className="w-5 h-5 text-blue-500" />;
    return <AlertCircle className="w-5 h-5 text-primary-500" />;
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
  };

  if (loading && notifications.length === 0) {
    return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          <p className="text-slate-500 text-sm">Stay updated with your queue and appointments</p>
        </div>
        <button onClick={markAllAsRead} className="text-sm font-medium text-primary-600 hover:text-primary-700">
          Mark all as read
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 sm:p-6 transition-colors hover:bg-slate-50 flex items-start gap-4 cursor-pointer ${!notification.is_read ? 'bg-primary-50/30' : ''}`}
            >
              <div className="flex-shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm font-medium text-slate-900 ${!notification.is_read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
                <p className={`text-sm text-slate-600 ${!notification.is_read ? 'text-slate-700' : ''}`}>
                  {notification.message}
                </p>
              </div>
              {!notification.is_read && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2"></div>
              )}
            </div>
          ))}
        </div>
        
        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
