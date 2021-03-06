import CardType from '@shared/enums/CardType'
import ServerCard from '../../../models/ServerCard'
import ServerGame from '../../../models/ServerGame'
import CardColor from '@shared/enums/CardColor'
import CardFaction from '@shared/enums/CardFaction'
import GameEventType from '@shared/enums/GameEventType'
import CardLocation from '@shared/enums/CardLocation'
import CardLibrary from '../../../libraries/CardLibrary'
import UnitVoidspawn from './UnitVoidspawn'
import BuffStrength from '../../../buffs/BuffStrength'
import BuffDuration from '@shared/enums/BuffDuration'
import BotCardEvaluation from '../../../AI/BotCardEvaluation'
import ExpansionSet from '@shared/enums/ExpansionSet'
import { asRecurringBuffPotency } from '@src/utils/LeaderStats'

export default class UnitAbyssPortal extends ServerCard {
	powerPerCard = asRecurringBuffPotency(1)

	constructor(game: ServerGame) {
		super(game, {
			type: CardType.UNIT,
			color: CardColor.BRONZE,
			faction: CardFaction.ARCANE,
			relatedCards: [UnitVoidspawn],
			stats: {
				power: 0,
				armor: 20,
			},
			expansionSet: ExpansionSet.BASE,
			hiddenFromLibrary: true,
		})
		this.dynamicTextVariables = {
			powerPerCard: this.powerPerCard,
		}
		this.botEvaluation = new CustomBotEvaluation(this)

		this.createCallback(GameEventType.TURN_ENDED, [CardLocation.BOARD])
			.require(({ group }) => group.owns(this))
			.perform(() => this.onTurnEnded())
	}

	public onTurnEnded(): void {
		const unit = this.unit
		if (!unit) {
			return
		}
		const owner = unit.originalOwner
		const voidspawn = CardLibrary.instantiate(this.game, UnitVoidspawn)
		this.game.board.createUnit(voidspawn, owner, unit.rowIndex, unit.unitIndex + 1)
		const uniqueCardsInAllDiscards = [
			...new Set(
				this.game.players
					.flatMap((playerGroup) => playerGroup.players)
					.map((player) => player.cardGraveyard.allCards)
					.flat()
					.map((card) => card.class)
			),
		]
		if (uniqueCardsInAllDiscards.length === 0) {
			return
		}

		voidspawn.buffs.addMultiple(BuffStrength, uniqueCardsInAllDiscards.length, this, BuffDuration.INFINITY)
	}
}

class CustomBotEvaluation extends BotCardEvaluation {
	get baseThreat(): number {
		return 5
	}
}
