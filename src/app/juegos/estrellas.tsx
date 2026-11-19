import { GameScreen } from '@/features/kids/game-chrome';
import { StarConnectGame } from '@/features/kids/star-connect-game';

// Juego "Une las estrellas". El trazo usa un gesto nativo, así que no hace falta congelar el scroll.
export default function StarConnectScreen() {
  return (
    <GameScreen>
      <StarConnectGame />
    </GameScreen>
  );
}
