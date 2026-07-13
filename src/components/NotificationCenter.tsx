import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  archiveNotification, 
  markAllNotificationsAsRead, 
  archiveAllNotifications,
  setupRealtimeNotifications
} from '../services/notificationService';
import { Notification, NotificationCategory } from '../types';
import { 
  Bell, CheckCircle, Trash2, Clock, Globe, ArrowLeftRight, 
  Trophy, Shield, HelpCircle, Inbox, ExternalLink, X, Check
} from 'lucide-react';

interface NotificationCenterProps {
  userId: string;
  language: 'en' | 'ar';
  setActiveTab: (tab: string) => void;
}

export default function NotificationCenter({
  userId,
  language,
  setActiveTab
}: NotificationCenterProps) {
  const isRtl = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications and subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications(userId);
        // Sort: non-archived first, unread first, newest first
        const sorted = data
          .filter(n => !n.isArchived)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(sorted);
      } catch (err) {
        console.error('[SNS UI] Failed to load notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time notification changes
    try {
      unsubscribe = setupRealtimeNotifications(userId, (newNotif) => {
        setNotifications(prev => {
          // Check if already exists (idempotency safety)
          if (prev.some(n => n.id === newNotif.id)) {
            return prev.map(n => n.id === newNotif.id ? newNotif : n);
          }
          if (newNotif.isArchived) {
            return prev.filter(n => n.id !== newNotif.id);
          }
          return [newNotif, ...prev];
        });
      });
    } catch (err) {
      console.error('[SNS UI] Realtime subscription error:', err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id, userId);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('[SNS UI] Mark read failed:', err);
    }
  };

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await archiveNotification(id, userId);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('[SNS UI] Archive failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('[SNS UI] Mark all read failed:', err);
    }
  };

  const handleArchiveAll = async () => {
    try {
      await archiveAllNotifications(userId);
      setNotifications([]);
    } catch (err) {
      console.error('[SNS UI] Archive all failed:', err);
    }
  };

  const handleActionClick = (actionUrl?: string) => {
    setIsOpen(false);
    if (!actionUrl) return;

    // Route links based on platform tabs
    if (actionUrl === '/dashboard' || actionUrl.includes('dashboard')) {
      setActiveTab('dashboard');
    } else if (actionUrl === '/compare' || actionUrl.includes('compare')) {
      setActiveTab('compare');
    } else if (actionUrl === '/submit' || actionUrl.includes('submit')) {
      setActiveTab('submit');
    } else if (actionUrl === '/savings' || actionUrl.includes('savings')) {
      setActiveTab('savings');
    } else if (actionUrl === '/profile' || actionUrl.includes('profile')) {
      setActiveTab('profile');
    } else if (actionUrl === '/srcmc' || actionUrl.includes('srcmc')) {
      setActiveTab('srcmc');
    }
  };

  // Filter notifications by category
  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  // Icon mapping for categories
  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'system':
      case 'security':
      case 'admin':
        return <Shield className="w-4 h-4 text-[#F59E0B]" />;
      case 'rate':
      case 'recommendation':
        return <ArrowLeftRight className="w-4 h-4 text-[#10B981]" />;
      case 'transfer':
      case 'savings':
        return <Globe className="w-4 h-4 text-[#3B82F6]" />;
      case 'achievement':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  // Color mapping for categories
  const getCategoryBg = (category: NotificationCategory) => {
    switch (category) {
      case 'system':
      case 'security':
      case 'admin':
        return 'bg-[#F59E0B]/10 border-[#F59E0B]/20';
      case 'rate':
      case 'recommendation':
        return 'bg-[#10B981]/10 border-[#10B981]/20';
      case 'transfer':
      case 'savings':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'achievement':
        return 'bg-amber-500/10 border-amber-500/20';
      default:
        return 'bg-slate-500/10 border-slate-500/20';
    }
  };

  // Readable category labels
  const getCategoryLabel = (category: string) => {
    if (isRtl) {
      switch (category) {
        case 'system': return 'النظام';
        case 'rate': return 'تنبيه الأسعار';
        case 'transfer': return 'التحويلات';
        case 'achievement': return 'الإنجازات';
      }
    } else {
      switch (category) {
        case 'system': return 'System';
        case 'rate': return 'Rate Alerts';
        case 'transfer': return 'Transfers';
        case 'achievement': return 'Achievements';
      }
    }
    return category;
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-slate-300 hover:text-amber-400 transition-all rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:scale-105 ${isOpen ? 'text-amber-400 border-amber-400' : ''}`}
        title={isRtl ? 'الإشعارات' : 'Notifications'}
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-slate-950 shadow-sm font-mono animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className={`absolute top-12 ${isRtl ? 'left-0' : 'right-0'} z-50 w-80 sm:w-96 rounded-2xl bg-[#091E3A] border border-slate-800 shadow-2xl overflow-hidden animate-fadeIn`}>
          {/* Header */}
          <div className="p-4 bg-[#051326] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="font-sans font-black text-sm text-white uppercase tracking-wider">
                {isRtl ? 'مركز الإشعارات' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-mono font-bold">
                  {unreadCount} {isRtl ? 'جديد' : 'NEW'}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-[#10B981] hover:underline cursor-pointer flex items-center gap-1"
                  title={isRtl ? 'قراءة الكل' : 'Mark all as read'}
                >
                  <Check className="w-3 h-3" />
                  <span>{isRtl ? 'قراءة الكل' : 'Mark read'}</span>
                </button>
                <span className="text-slate-600 font-mono text-[10px]">|</span>
                <button
                  onClick={handleArchiveAll}
                  className="text-[10px] font-bold text-red-400 hover:underline cursor-pointer flex items-center gap-1"
                  title={isRtl ? 'أرشفة الكل' : 'Archive all'}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isRtl ? 'أرشفة الكل' : 'Archive all'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="px-3 py-2 bg-[#06172E] border-b border-slate-850 flex gap-1.5 overflow-x-auto scrollbar-none">
            {['all', 'rate', 'transfer', 'achievement', 'system'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase shrink-0 transition-all cursor-pointer border ${
                  activeCategory === cat
                    ? 'bg-[#10B981] text-[#051326] border-[#10B981]'
                    : 'bg-slate-900/40 text-slate-400 border-slate-800/80 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                {cat === 'all' ? (isRtl ? 'الكل' : 'All') : getCategoryLabel(cat)}
              </button>
            ))}
          </div>

          {/* Notification List Scroll Area */}
          <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-850/60 scrollbar-thin scrollbar-thumb-slate-800">
            {loading ? (
              <div className="p-8 text-center text-xs text-sds-text-sec flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-[#10B981] animate-spin" />
                <span>{isRtl ? 'جاري التحميل...' : 'Syncing with SNS...'}</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-[#081B34]">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
                  <Inbox className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                    {isRtl ? 'لا توجد إشعارات' : 'Inbox Clean'}
                  </p>
                  <p className="text-[10px] text-sds-text-sec max-w-[200px] leading-relaxed mx-auto">
                    {isRtl 
                      ? 'لا توجد إشعارات غير مؤرشفة في هذا التصنيف حالياً.' 
                      : `No active ${activeCategory === 'all' ? '' : activeCategory.replace('_', ' ')} notifications.`}
                  </p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id, { stopPropagation: () => {} } as any)}
                  className={`p-3.5 text-left transition-colors relative flex gap-3 cursor-pointer group ${
                    notif.isRead ? 'bg-[#091E3A] hover:bg-[#0c284c]' : 'bg-[#0b2547] hover:bg-[#0f325e] border-l-2 border-amber-400'
                  }`}
                >
                  {/* Category Visual Bubble Icon */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${getCategoryBg(notif.category)} shadow-xs`}>
                    {getCategoryIcon(notif.category)}
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className={`text-xs text-white leading-snug break-words ${notif.isRead ? 'font-medium opacity-85' : 'font-extrabold'}`}>
                        {notif.title}
                      </p>
                      
                      {/* Priority Tag */}
                      {notif.priority === 'high' && (
                        <span className="px-1 rounded-sm bg-red-500/15 text-red-400 border border-red-500/20 text-[7px] font-mono font-black uppercase tracking-wider">
                          HIGH
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-sds-text-sec leading-relaxed break-words">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[9px] text-sds-text-sec font-mono font-bold">
                      {/* Date details */}
                      <span className="flex items-center gap-1 opacity-75">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </span>

                      {/* Action Links & Operations */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {notif.actionUrl && (
                          <button
                            onClick={() => handleActionClick(notif.actionUrl)}
                            className="px-1.5 py-0.5 rounded-sm bg-slate-900 border border-slate-800 text-[#10B981] hover:text-white hover:bg-[#10B981] transition-all flex items-center gap-1"
                          >
                            <span>{notif.actionLabel || (isRtl ? 'افتح' : 'Open')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                        {!notif.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="p-1 rounded-sm hover:bg-slate-800 text-[#10B981] transition-colors"
                            title={isRtl ? 'تحديد كمقروء' : 'Mark Read'}
                          >
                            <Check className="w-3 h-3 stroke-[3.5]" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleArchive(notif.id, e)}
                          className="p-1 rounded-sm hover:bg-slate-800 text-red-400 transition-colors"
                          title={isRtl ? 'أرشفة' : 'Archive'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Preference Quick Link */}
          <div className="p-3 bg-[#051326] border-t border-slate-850 text-center">
            <button
              onClick={() => { setIsOpen(false); setActiveTab('profile'); }}
              className="text-[10px] font-mono font-black text-amber-400 hover:text-white uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <span>{isRtl ? 'إعدادات التنبيهات' : 'Configure Notification Preferences'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
