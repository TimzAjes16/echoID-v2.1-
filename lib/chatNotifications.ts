/**
 * Chat notification utilities
 * Track unread messages per consent for displaying badges
 */

import * as SQLite from 'expo-sqlite';

let chatDb: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize chat database connection
 */
async function getChatDb(): Promise<SQLite.SQLiteDatabase | null> {
  if (!chatDb) {
    try {
      chatDb = await SQLite.openDatabaseAsync('echoid_chat.db');
    } catch (error) {
      console.error('[ChatNotifications] Failed to open chat DB:', error);
      return null;
    }
  }
  return chatDb;
}

/**
 * Get unread message count for a consent
 * Counts messages NOT from the current user
 * Note: consent_id in DB is actually consent.id (string), not consent.consentId (bigint)
 */
export async function getUnreadCount(consentId: bigint | string, currentUserAddress: string): Promise<number> {
  const db = await getChatDb();
  if (!db) return 0;

  try {
    // Convert to string for query (can be bigint or string)
    const consentIdStr = typeof consentId === 'bigint' ? consentId.toString() : consentId;
    
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages WHERE consent_id = ? AND sender != ?',
      [consentIdStr, currentUserAddress]
    );
    return result?.count || 0;
  } catch (error) {
    console.error('[ChatNotifications] Failed to get unread count:', error);
    return 0;
  }
}

/**
 * Get unread message count for all consents
 * Returns a map of consent.id (string) -> unread count
 */
export async function getAllUnreadCounts(currentUserAddress: string): Promise<Map<string, number>> {
  const db = await getChatDb();
  const counts = new Map<string, number>();

  if (!db) return counts;

  try {
    const results = await db.getAllAsync<{ consent_id: string; count: number }>(
      'SELECT consent_id, COUNT(*) as count FROM messages WHERE sender != ? GROUP BY consent_id',
      [currentUserAddress]
    );

    for (const row of results) {
      // consent_id in DB is consent.id (string), not consent.consentId (bigint)
      counts.set(row.consent_id, row.count);
    }
  } catch (error) {
    console.error('[ChatNotifications] Failed to get all unread counts:', error);
  }

  return counts;
}

/**
 * Check if there are any unread messages across all consents
 */
export async function hasUnreadMessages(currentUserAddress: string): Promise<boolean> {
  const counts = await getAllUnreadCounts(currentUserAddress);
  return counts.size > 0;
}

/**
 * Get unread count for a consent request
 * This checks if there's an accepted consent with messages
 */
export async function getUnreadForRequest(
  fromHandle: string,
  counterpartyAddress: string,
  currentUserAddress: string
): Promise<number> {
  const db = await getChatDb();
  if (!db) return 0;

  try {
    // Find consents where the sender is the counterparty
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM messages m
       WHERE m.sender = ? AND m.sender != ?`,
      [counterpartyAddress, currentUserAddress]
    );
    return result?.count || 0;
  } catch (error) {
    console.error('[ChatNotifications] Failed to get unread for request:', error);
    return 0;
  }
}

