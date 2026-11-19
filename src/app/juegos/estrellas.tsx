import { useState } from 'react';

import { GameScreen } from '@/features/kids/game-chrome';
import { StarConnectGame } from '@/features/kids/star-connect-game';

// Juego "Une las estrellas". Mientras el dedo traza, se congela el scroll de la pantalla
// para que no se "robe" el gesto (igual que en los otros juegos de arrastrar).
export default function StarConnectScreen() {
  const [dragging, setDragging] = useState(false);
  return (
    <GameScreen scrollEnabled={!dragging}>
      <StarConnectGame onDraggingChange={setDragging} />
    </GameScreen>
  );
}
