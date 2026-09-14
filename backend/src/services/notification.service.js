import Notification from '../models/Notification.js';
import pino from 'pino';

const logger = pino();

export const createNotification = async (organizationId, title, message) => {
  try {
    const notification = await Notification.create({
      organizationId,
      title,
      message,
    });
    // In the future, trigger email sending here (e.g., SendGrid/AWS SES)
    return notification;
  } catch (error) {
    logger.error(`Notification Error: ${error.message}`);
  }
};
