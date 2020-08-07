import CardType from '@shared/enums/CardType'
import ServerCard from '../../../models/ServerCard'
import ServerGame from '../../../models/ServerGame'
import CardColor from '@shared/enums/CardColor'
import CardTribe from '@shared/enums/CardTribe'
import CardFaction from '@shared/enums/CardFaction'
import BuffStrength from '../../../buffs/BuffStrength'
import BuffDuration from '@shared/enums/BuffDuration'
import ServerAnimation from '../../../models/ServerAnimation'
import GameEventType from '@shared/enums/GameEventType'
import BuffAlignment from '@shared/enums/BuffAlignment'

export default class UnitMasterSwordsmith extends ServerCard {
	bonusPower = 1

	constructor(game: ServerGame) {
		super(game, CardType.UNIT, CardColor.BRONZE, CardFaction.NEUTRAL)
		this.basePower = 2
		this.baseTribes = [CardTribe.HUMAN]
		this.dynamicTextVariables = {
			bonusPower: this.bonusPower
		}

		this.createEffect(GameEventType.UNIT_DEPLOYED)
			.perform(() => this.onDeploy())
	}

	private onDeploy(): void {
		const unit = this.unit
		const owner = unit.owner
		const targets = owner.cardHand.unitCards
		this.game.animation.play(ServerAnimation.cardAffectsCards(this, targets))
		targets.forEach(card => card.buffs.add(BuffStrength, this, BuffDuration.INFINITY))
		this.game.animation.play(ServerAnimation.cardReceivedBuff(targets, BuffAlignment.POSITIVE))
	}
}
