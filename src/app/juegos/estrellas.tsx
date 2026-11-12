import { GameScreen } from '@/features/kids/game-chrome';
import { StarConnectGame } from '@/features/kids/star-connect-game';

// Juego "Une las estrellas".
export default function StarConnectScreen() {
  return (
    <GameScreen>
      <StarConnectGame />
    </GameScreen>
  );
}
