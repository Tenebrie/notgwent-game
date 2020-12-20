import CardType from '@shared/enums/CardType'
import ServerCard from '../../../models/ServerCard'
import ServerGame from '../../../models/ServerGame'
import CardColor from '@shared/enums/CardColor'
import CardTribe from '@shared/enums/CardTribe'
import CardFaction from '@shared/enums/CardFaction'
import BuffStrength from '../../../buffs/BuffStrength'
import BuffDuration from '@shared/enums/BuffDuration'
import GameEventType from '@shared/enums/GameEventType'
import CardFeature from '@shared/enums/CardFeature'
import Utils from '../../../../utils/Utils'
import ExpansionSet from '@shared/enums/ExpansionSet'
import {asMassBuffPotency} from '../../../../utils/LeaderStats'
import CardLocation from '@shared/enums/CardLocation'
import BuffExtraArmor from '../../../buffs/BuffExtraArmor'

export default class UnitGenerousBlacksmith extends ServerCard {
	bonusArmor = asMassBuffPotency(3)

	constructor(game: ServerGame) {
		super(game, {
			type: CardType.UNIT,
			color: CardColor.BRONZE,
			faction: CardFaction.HUMAN,
			tribes: [CardTribe.PEASANT],
			features: [CardFeature.KEYWORD_DEPLOY],
			stats: {
				power: 7,
			},
			expansionSet: ExpansionSet.BASE,
		})
		this.dynamicTextVariables = {
			bonusArmor: this.bonusArmor
		}

		this.createCallback(GameEventType.UNIT_MOVED, [CardLocation.BOARD])
			.require(({ triggeringUnit }) => triggeringUnit.card !== this)
			.require(({ fromRow, toRow }) => fromRow !== toRow)
			.require(({ toRow, toIndex }) => toRow.index === this.unit!.rowIndex && Math.abs(toIndex - this.unit!.unitIndex) === 1)
			.requireImmediate(({ triggeringUnit }) => triggeringUnit.isAlive())
			.perform(({ triggeringUnit }) => {
				triggeringUnit.buffs.addMultiple(BuffExtraArmor, this.bonusArmor, this)
			})
	}
}
