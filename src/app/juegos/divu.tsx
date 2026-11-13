import { useState } from 'react';

import { DivuGame } from '@/features/kids/divu-game';
import { GameScreen } from '@/features/kids/game-chrome';

// Juego "Divu y su merienda". Al ser una ruta propia, el botón "atrás" de Android regresa a Niños.
// En iOS el scroll y el arrastre escuchan el mismo dedo: mientras se arrastra la comida, se congela el scroll.
export default function DivuGameScreen() {
  const [dragging, setDragging] = useState(false);
  return (
    <GameScreen scrollEnabled={!dragging}>
      <DivuGame onDraggingChange={setDragging} />
    </GameScreen>
  );
}
