// backend/utils/socketEmitter.js
/**
 * Emit a socket event to:
 *  - a specific user room  (userId)
 *  - the admin broadcast room ('admin')
 *  - or both
 *
 * Usage inside any controller:
 *   const emit = require('../utils/socketEmitter');
 *   emit(req, 'attendance:update', { userId, status });
 */

const emit = (req, event, payload = {}) => {
  const io = req.io;
  if (!io) return;

  // Always notify admins
  io.to('admin').emit(event, payload);

  // Also notify the specific user if userId present in payload
  if (payload.userId) {
    io.to(String(payload.userId)).emit(event, payload);
  }
};

module.exports = emit;