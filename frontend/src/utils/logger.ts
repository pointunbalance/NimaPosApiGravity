
import { db } from '../db';
import { LogType, User, LogStatus } from '../types';

/**
 * Records an activity in the audit log.
 * @param type The category of the log (sale, purchase, etc.)
 * @param action A short descriptive title of the action
 * @param details Additional details (optional)
 * @param amount Financial amount involved (optional)
 * @param refId Reference ID (e.g., Order ID, Customer ID) (optional)
 * @param status Status of the action (success, warning, error) (default: success)
 */
export const logActivity = async (
  type: LogType,
  action: string,
  details: string = '',
  amount?: number,
  refId?: number,
  status: LogStatus = 'success'
) => {
  try {
    // Get current user from local storage
    const userJson = localStorage.getItem('nima_user');
    const currentUser: User | null = userJson ? JSON.parse(userJson) : null;
    const userName = currentUser ? currentUser.name : 'System/Unknown';

    await db.logs.add({
      type,
      action,
      details,
      amount,
      user: userName,
      date: new Date(),
      referenceId: refId,
      status
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};
