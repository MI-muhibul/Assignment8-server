function sendError(res, status, message) {
  return res.status(status).json({ message });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, imageUrl: user.imageUrl || "" };
}

module.exports = { sendError, publicUser };
