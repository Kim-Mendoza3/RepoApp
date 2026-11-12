import { useState } from 'react';

import { BugSortGame } from '@/features/kids/bug-sort-game';
import { GameScreen } from '@/features/kids/game-chrome';

// Juego "¿Insecto o arácnido?". Se congela el scroll mientras se arrastra un animal (iOS).
export default function BugSortScreen() {
  const [dragging, setDragging] = useState(false);
  return (
    <GameScreen scrollEnabled={!dragging}>
      <BugSortGame onDraggingChange={setDragging} />
    </GameScreen>
  );
}
