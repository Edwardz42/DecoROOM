import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import BattlePage from "./pages/BattlePage";
import SoloBattlePage from "./pages/SoloBattlePage";
import CollectionPage from "./pages/CollectionPage";
import {
  LobbyScreen,
  RoomCreateScreen,
  RoomJoinScreen,
  QuestionPickScreen,
  RoomReadyScreen,
  ResultsScreen,
  DeckbuilderScreen,
  LeaderboardScreen,
  RoomWaitScreen,
} from "./pages/HomePage";
import { syncClientSessionWithBackend } from "./sessionSync";

function goToLanding() {
  window.location.href = "./landing.html";
}

function LandingRedirect() {
  goToLanding();
  return null;
}

const SCREENS = {
  lobby:           LobbyScreen,
  "room-create":   RoomCreateScreen,
  "room-join":     RoomJoinScreen,
  "pick-questions": QuestionPickScreen,
  "room-ready":    RoomReadyScreen,
  battle:          BattlePage,
  "solo-battle":  SoloBattlePage,
  results:         ResultsScreen,
  gacha:           LandingRedirect,
  collection:      CollectionPage,
  deckbuilder:     DeckbuilderScreen,
  leaderboard:     LeaderboardScreen,
  "room-wait":     RoomWaitScreen,
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("screen");
  const isValidRequestedScreen = !!requested && !!SCREENS[requested] && requested !== "lobby" && requested !== "gacha";

  const [isReady, setIsReady] = useState(false);
  const [screen, setScreen] = useState(isValidRequestedScreen ? requested : null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await Promise.race([
        syncClientSessionWithBackend(),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
      if (!cancelled) {
        setIsReady(true);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isValidRequestedScreen) {
      goToLanding();
      return;
    }

    setScreen(requested);
  }, [isReady, isValidRequestedScreen, requested]);

  if (!isReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at center, #1c2a3d 0%, #000000 100%)", color: "rgba(255,255,255,0.7)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, textTransform: "uppercase", fontSize: "0.78rem" }}>
        Initializing session...
      </div>
    );
  }

  if (!screen) {
    return null;
  }

  const navTo = (s) => {
    if (s === "lobby" || s === "gacha") {
      goToLanding();
      return;
    }
    setScreen(s);
    window.history.replaceState(null, "", `?screen=${s}`);
  };

  const Screen = SCREENS[screen] || LobbyScreen;
  return <Screen onNav={navTo} />;
}

createRoot(document.getElementById("root")).render(<App />);
