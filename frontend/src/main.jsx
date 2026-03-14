import { useState } from "react";
import { createRoot } from "react-dom/client";

import BattlePage from "./pages/BattlePage";
import CollectionPage from "./pages/CollectionPage";
import {
  LobbyScreen,
  RoomCreateScreen,
  RoomJoinScreen,
  QuestionPickScreen,
  ResultsScreen,
  GachaScreen,
  DeckbuilderScreen,
  LeaderboardScreen,
} from "./pages/HomePage";

const SCREENS = {
  lobby:           LobbyScreen,
  "room-create":   RoomCreateScreen,
  "room-join":     RoomJoinScreen,
  "pick-questions": QuestionPickScreen,
  battle:          BattlePage,
  results:         ResultsScreen,
  gacha:           GachaScreen,
  collection:      CollectionPage,
  deckbuilder:     DeckbuilderScreen,
  leaderboard:     LeaderboardScreen,
};

function App() {
  const [screen, setScreen] = useState("lobby");
  const Screen = SCREENS[screen] || LobbyScreen;
  return <Screen onNav={setScreen} />;
}

createRoot(document.getElementById("root")).render(<App />);
