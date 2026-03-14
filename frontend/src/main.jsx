import { useState } from "react";
import { createRoot } from "react-dom/client";

import BattlePage from "./pages/BattlePage";
import CollectionPage from "./pages/CollectionPage";
import {
  LobbyScreen,
  RoomCreateScreen,
  RoomJoinScreen,
  QuestionPickScreen,
  RoomReadyScreen,
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
  "room-ready":    RoomReadyScreen,
  battle:          BattlePage,
  results:         ResultsScreen,
  gacha:           GachaScreen,
  collection:      CollectionPage,
  deckbuilder:     DeckbuilderScreen,
  leaderboard:     LeaderboardScreen,
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("screen");
  const initial = requested && SCREENS[requested] ? requested : "lobby";
  const [screen, setScreen] = useState(initial);

  const navTo = (s) => {
    setScreen(s);
    window.history.replaceState(null, "", `?screen=${s}`);
  };

  const Screen = SCREENS[screen] || LobbyScreen;
  return <Screen onNav={navTo} />;
}

createRoot(document.getElementById("root")).render(<App />);
