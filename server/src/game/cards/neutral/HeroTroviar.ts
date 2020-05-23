import CardType from '@shared/enums/CardType'
import CardColor from '@shared/enums/CardColor'
import ServerCard from '../../models/ServerCard'
import ServerGame from '../../models/ServerGame'
import ServerUnit from '../../models/ServerUnit'
import CardFaction from '@shared/enums/CardFaction'
import ServerDamageInstance from '../../models/ServerDamageSource'
import BuffStrength from '../../buffs/BuffStrength'
import BuffDuration from '@shared/enums/BuffDuration'

export default class HeroTroviar extends ServerCard {
	powerGained = 1

	constructor(game: ServerGame) {
		super(game, CardType.UNIT, CardColor.GOLDEN, CardFaction.NEUTRAL)
		this.basePower = 8
		this.dynamicTextVariables = {
			powerGained: this.powerGained
		}
	}

	onAfterOtherUnitDamageTaken(otherUnit: ServerUnit, damage: ServerDamageInstance): void {
		for (let i = 0; i < this.powerGained; i++) {
			this.buffs.add(new BuffStrength(), this, BuffDuration.INFINITY)
		}
	}
}
