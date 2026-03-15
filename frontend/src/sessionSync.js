const SESSION_KEYS_TO_CLEAR = [
  'playerId',
  'username',
  'roomId',
  'roomRole',
  'unlockedQuestionIds',
  'selectedDeckIds',
  'lastPackOpenedAt',
  'starterPackClaimed',
  'lastScore',
  'lastOppScore',
  'lastTime',
  'lastWinnerPlayerId',
];

function clearClientSessionState() {
  SESSION_KEYS_TO_CLEAR.forEach((k) => localStorage.removeItem(k));
}

export async function syncClientSessionWithBackend() {
  try {
    const response = await fetch('/api/health', {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const bootId = data?.bootId;
    if (!bootId) {
      return false;
    }

    const currentBootId = localStorage.getItem('backendBootId');
    if (!currentBootId || currentBootId !== bootId) {
      clearClientSessionState();
      localStorage.setItem('backendBootId', bootId);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
