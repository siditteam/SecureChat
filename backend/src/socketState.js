// Shared socket state so HTTP routes can emit real-time events
const onlineUsers = new Map(); // userId (string) -> socketId
let _io = null;

module.exports = {
  onlineUsers,
  setIO: (io) => { _io = io; },
  emit: (userId, event, data) => {
    const sid = onlineUsers.get(String(userId));
    if (_io && sid) _io.to(sid).emit(event, data);
  },
};
