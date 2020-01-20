import GameTurnPhase from '@/shared/enums/GameTurnPhase';
import Core from '@/Pixi/Core';
import OutgoingMessageHandlers from '@/Pixi/handlers/OutgoingMessageHandlers';
import AttackOrder from '@/shared/models/AttackOrder';
export default class ClientGame {
    constructor() {
        this.currentTime = 0;
        this.maximumTime = 1;
        this.turnPhase = GameTurnPhase.BEFORE_GAME;
    }
    setTurnPhase(phase) {
        this.turnPhase = phase;
        if (phase === GameTurnPhase.SKIRMISH) {
            const cards = Core.board.getCardsOwnedByPlayer(Core.player).filter(unit => !!unit.preferredAttackTarget);
            cards.forEach(unit => {
                OutgoingMessageHandlers.sendUnitAttackOrders(new AttackOrder(unit, unit.preferredAttackTarget));
            });
        }
    }
}
//# sourceMappingURL=ClientGame.js.map