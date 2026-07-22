import { isSupabaseConfigured, supabaseClient, fetchAllUserProfiles, getAuthSession } from './supabaseService';
import { Notification, NotificationCategory, NotificationPriority } from '../types';

export type CreateNotificationInput = {
  userId?: string;
  audienceType: 'user' | 'all_users' | 'corridor' | 'channel' | 'srcmc' | 'srcmc_permission' | 'main_admin' | string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  payload?: Record<string, any>;
  sourceSystem?: string;
  sourceEvent?: string;
  sourceId?: string;
  expiresAt?: string;
  idempotencyKey?: string;
};

const NOTIFICATIONS_LOCAL_KEY = 'sr_supabase_notifications';

// Helper to access localStorage safely
const getLocalNotifications = (): Notification[] => {
  const stored = localStorage.getItem(NOTIFICATIONS_LOCAL_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored) as Notification[];
  } catch {
    return [];
  }
};

const saveLocalNotifications = (notifications: Notification[]): void => {
  localStorage.setItem(NOTIFICATIONS_LOCAL_KEY, JSON.stringify(notifications));
};

// In-app Pub/Sub system for instant client-side triggers
type NotificationListener = (notification: Notification) => void;
const listeners = new Set<NotificationListener>();

export function subscribeToNotifications(listener: NotificationListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(notification: Notification) {
  listeners.forEach(l => {
    try {
      l(notification);
    } catch (e) {
      console.error('[SNS Listener Error]', e);
    }
  });
}

/**
 * Creates one or more notifications depending on audienceType.
 * Features: Idempotency protection, group routing, and dual-mode execution.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  // 1. Resolve User IDs based on Audience Type
  let targetUserIds: string[] = [];

  try {
    if (input.audienceType === 'user') {
      if (input.userId) {
        targetUserIds = [input.userId];
      }
    } else {
      // Group-based routing. Fetch all relevant user profiles
      const profiles = await fetchAllUserProfiles();
      
      if (input.audienceType === 'all_users') {
        targetUserIds = profiles.map(p => p.id).filter(Boolean);
      } else if (input.audienceType === 'corridor') {
        const corridorId = input.payload?.corridorId || input.payload?.corridor_id;
        targetUserIds = profiles
          .filter(p => p.preferredCorridorId === corridorId || p.preferred_corridor_id === corridorId)
          .map(p => p.id)
          .filter(Boolean);
      } else if (input.audienceType === 'channel') {
        const providerId = input.payload?.providerId || input.payload?.provider_id;
        targetUserIds = profiles
          .filter(p => {
            const preferred = p.preferred_channels || p.preferred_channels || [];
            return preferred.includes(providerId);
          })
          .map(p => p.id)
          .filter(Boolean);
      } else if (input.audienceType === 'srcmc' || input.audienceType === 'srcmc_permission' || input.audienceType === 'main_admin') {
        targetUserIds = [];
      }
    }
  } catch (err) {
    console.error('[SNS Audience Resolve Failed]', err);
    if (input.userId) {
      targetUserIds = [input.userId];
    }
  }

  if (targetUserIds.length === 0) {
    console.warn('[SNS] No target users found for notification:', input.title);
    return;
  }

  const now = new Date().toISOString();

  // 2. Persist in database/emulated store
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const dbPayloads = targetUserIds.map(uid => ({
        user_id: uid,
        audience_type: input.audienceType,
        category: input.category,
        priority: input.priority,
        title: input.title,
        message: input.message,
        action_label: input.actionLabel || null,
        action_url: input.actionUrl || null,
        payload: input.payload || {},
        source_system: input.sourceSystem || null,
        source_event: input.sourceEvent || null,
        source_id: input.sourceId || null,
        expires_at: input.expiresAt || null,
        idempotency_key: input.idempotencyKey || null,
        is_read: false,
        is_archived: false,
        created_at: now,
        updated_at: now
      }));

      // Insert in chunks or singular to avoid huge payload crashes
      const { error } = await supabaseClient
        .from('notifications')
        .insert(dbPayloads);

      if (error) {
        // If it's a duplicate key error (code 23505), ignore as it means idempotency worked perfectly
        if (error.code === '23505') {
          console.log('[SNS] Duplicate notification ignored via idempotency check.');
          return;
        }
        throw error;
      }

      // Trigger local listeners for the logged-in user in real-time
      const activeUser = getAuthSession().user;
      if (activeUser && targetUserIds.includes(activeUser.id)) {
        notifyListeners({
          id: Math.random().toString(), // Dummy temporary ID for the event trigger
          userId: activeUser.id,
          audienceType: input.audienceType,
          category: input.category,
          priority: input.priority,
          title: input.title,
          message: input.message,
          actionLabel: input.actionLabel,
          actionUrl: input.actionUrl,
          payload: input.payload || {},
          sourceSystem: input.sourceSystem,
          sourceEvent: input.sourceEvent,
          sourceId: input.sourceId,
          isRead: false,
          isArchived: false,
          expiresAt: input.expiresAt,
          createdAt: now,
          updatedAt: now,
          idempotencyKey: input.idempotencyKey
        });
      }
      return;
    } catch (dbErr) {
      console.warn('[SNS DB Write Failed, falling back to emulation]', dbErr);
    }
  }

  // Local Storage Emulation Fallback
  const allLocal = getLocalNotifications();
  const addedNotifications: Notification[] = [];

  for (const uid of targetUserIds) {
    // Idempotency check
    if (input.idempotencyKey) {
      const exists = allLocal.some(n => n.userId === uid && n.idempotencyKey === input.idempotencyKey);
      if (exists) {
        continue;
      }
    }

    const newNotif: Notification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      userId: uid,
      audienceType: input.audienceType,
      category: input.category,
      priority: input.priority,
      title: input.title,
      message: input.message,
      actionLabel: input.actionLabel,
      actionUrl: input.actionUrl,
      payload: input.payload || {},
      sourceSystem: input.sourceSystem,
      sourceEvent: input.sourceEvent,
      sourceId: input.sourceId,
      isRead: false,
      isArchived: false,
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now,
      idempotencyKey: input.idempotencyKey
    };

    allLocal.push(newNotif);
    addedNotifications.push(newNotif);
  }

  if (addedNotifications.length > 0) {
    saveLocalNotifications(allLocal);

    // Notify listeners if the active user is targeted
    const activeUser = getAuthSession().user;
    if (activeUser) {
      const targeted = addedNotifications.find(n => n.userId === activeUser.id);
      if (targeted) {
        notifyListeners(targeted);
      }
    }
  }
}

/**
 * Fetches non-expired notifications for a specific user.
 */
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data
          .map(raw => ({
            id: raw.id,
            userId: raw.user_id,
            audienceType: raw.audience_type,
            category: raw.category as NotificationCategory,
            priority: raw.priority as NotificationPriority,
            title: raw.title,
            message: raw.message,
            actionLabel: raw.action_label,
            actionUrl: raw.action_url,
            payload: raw.payload || {},
            sourceSystem: raw.source_system,
            sourceEvent: raw.source_event,
            sourceId: raw.source_id,
            isRead: raw.is_read,
            readAt: raw.read_at,
            isArchived: raw.is_archived,
            archivedAt: raw.archived_at,
            expiresAt: raw.expires_at,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
            idempotencyKey: raw.idempotency_key
          }))
          .filter(n => !n.expiresAt || new Date(n.expiresAt).getTime() > Date.now());
      }
      console.warn('[SNS DB Fetch Error]', error);
    } catch (err) {
      console.warn('[SNS DB Fetch Exception]', err);
    }
  }

  // Emulated storage fallback
  const allLocal = getLocalNotifications();
  return allLocal
    .filter(n => n.userId === userId)
    .filter(n => !n.expiresAt || new Date(n.expiresAt).getTime() > Date.now())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .update({
          is_read: true,
          read_at: now,
          updated_at: now
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (!error) return;
      console.warn('[SNS DB Mark Read Error]', error);
    } catch (err) {
      console.warn('[SNS DB Mark Read Exception]', err);
    }
  }

  // Emulated fallback
  const allLocal = getLocalNotifications();
  const updated = allLocal.map(n => {
    if (n.id === notificationId && n.userId === userId) {
      return { ...n, isRead: true, readAt: now, updatedAt: now };
    }
    return n;
  });
  saveLocalNotifications(updated);
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .update({
          is_read: true,
          read_at: now,
          updated_at: now
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (!error) return;
      console.warn('[SNS DB Mark All Read Error]', error);
    } catch (err) {
      console.warn('[SNS DB Mark All Read Exception]', err);
    }
  }

  // Emulated fallback
  const allLocal = getLocalNotifications();
  const updated = allLocal.map(n => {
    if (n.userId === userId && !n.isRead) {
      return { ...n, isRead: true, readAt: now, updatedAt: now };
    }
    return n;
  });
  saveLocalNotifications(updated);
}

/**
 * Archive a notification.
 */
export async function archiveNotification(notificationId: string, userId: string): Promise<void> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .update({
          is_archived: true,
          archived_at: now,
          updated_at: now
        })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (!error) return;
      console.warn('[SNS DB Archive Error]', error);
    } catch (err) {
      console.warn('[SNS DB Archive Exception]', err);
    }
  }

  // Emulated fallback
  const allLocal = getLocalNotifications();
  const updated = allLocal.map(n => {
    if (n.id === notificationId && n.userId === userId) {
      return { ...n, isArchived: true, archivedAt: now, updatedAt: now };
    }
    return n;
  });
  saveLocalNotifications(updated);
}

/**
 * Archive all active notifications for a user.
 */
export async function archiveAllNotifications(userId: string): Promise<void> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('notifications')
        .update({
          is_archived: true,
          archived_at: now,
          updated_at: now
        })
        .eq('user_id', userId)
        .eq('is_archived', false);

      if (!error) return;
      console.warn('[SNS DB Archive All Error]', error);
    } catch (err) {
      console.warn('[SNS DB Archive All Exception]', err);
    }
  }

  // Emulated fallback
  const allLocal = getLocalNotifications();
  const updated = allLocal.map(n => {
    if (n.userId === userId && !n.isArchived) {
      return { ...n, isArchived: true, archivedAt: now, updatedAt: now };
    }
    return n;
  });
  saveLocalNotifications(updated);
}

/**
 * Delete non-critical, non-security user owned notifications.
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      // Allow deletion only if category is not security or admin
      const { error } = await supabaseClient
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId)
        .not('category', 'in', '("security","admin")');

      if (!error) return;
      console.warn('[SNS DB Delete Error]', error);
    } catch (err) {
      console.warn('[SNS DB Delete Exception]', err);
    }
  }

  // Emulated fallback
  const allLocal = getLocalNotifications();
  const filtered = allLocal.filter(n => {
    const isTarget = n.id === notificationId && n.userId === userId;
    if (isTarget) {
      // Do not allow deleting critical security/admin notifications
      return n.category === 'security' || n.category === 'admin';
    }
    return true;
  });
  saveLocalNotifications(filtered);
}

/**
 * Subscribes to Supabase real-time notifications for the active user session.
 */
export function setupRealtimeNotifications(userId: string, onNewNotification: (n: Notification) => void) {
  if (isSupabaseConfigured && supabaseClient) {
    try {
      const channel = supabaseClient
        .channel(`public:notifications:user_id=eq.${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const raw = payload.new;
            if (raw) {
              const mapped: Notification = {
                id: raw.id,
                userId: raw.user_id,
                audienceType: raw.audience_type,
                category: raw.category as NotificationCategory,
                priority: raw.priority as NotificationPriority,
                title: raw.title,
                message: raw.message,
                actionLabel: raw.action_label,
                actionUrl: raw.action_url,
                payload: raw.payload || {},
                sourceSystem: raw.source_system,
                sourceEvent: raw.source_event,
                sourceId: raw.source_id,
                isRead: raw.is_read,
                readAt: raw.read_at,
                isArchived: raw.is_archived,
                archivedAt: raw.archived_at,
                expiresAt: raw.expires_at,
                createdAt: raw.created_at,
                updatedAt: raw.updated_at,
                idempotencyKey: raw.idempotency_key
              };
              onNewNotification(mapped);
            }
          }
        )
        .subscribe();

      return () => {
        supabaseClient?.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[SNS Realtime setup failed]', err);
    }
  }
  return () => {};
}
