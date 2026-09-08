const AuditLog = require('../models/AuditLog');

function getIp(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || req.ip || 'unknown';
}

/**
 * Writes one audit log entry. Never throws — a logging failure should
 * never break the request it's attached to, so errors are swallowed
 * and just printed to the server console.
 *
 * @param {import('express').Request} req
 * @param {{ action: string, details?: string, actionType: string, user?: string, userId?: string }} entry
 */
async function logAudit(req, entry) {
  try {
    const actorName =
      entry.user ||
      (req.user && (req.user.name || req.user.email)) ||
      'System';

    await AuditLog.create({
      user: actorName,
      userId: entry.userId || (req.user && req.user._id) || undefined,
      action: entry.action,
      details: entry.details || '',
      ipAddress: getIp(req),
      actionType: entry.actionType,
    });
  } catch (err) {
    console.error('[audit] failed to write log entry:', err.message);
  }
}

module.exports = { logAudit };
