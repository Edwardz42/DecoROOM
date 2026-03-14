function generateId() {
  return Math.random().toString(36).substring(2, 12);
}

function createPlayer({ email, name }) {
  return {
    id: generateId(),
    email,
    name,
    wins: 0,
    losses: 0,
    packsOpened: 0,
    collection: [],
    createdAt: new Date().toISOString()
  };
}

module.exports = createPlayer;