import CardType from '@shared/enums/CardType'
import ServerCard from '../../../../models/ServerCard'
import ServerGame from '../../../../models/ServerGame'
import CardColor from '@shared/enums/CardColor'
import CardFeature from '@shared/enums/CardFeature'
import CardFaction from '@shared/enums/CardFaction'
import TargetType from '@shared/enums/TargetType'
import ServerUnit from '../../../../models/ServerUnit'
import GameEventType from '@shared/enums/GameEventType'
import ExpansionSet from '@shared/enums/ExpansionSet'
import {createCardFromInstance, createCardFromLibrary, ownerOf} from '../../../../../utils/GameUtils'

export default class SpellShadowArmy extends ServerCard {
	powerThreshold = 3
	thresholdDecrease = 1
	allowedTargets = 1
	copiedUnits: ServerUnit[] = []

	constructor(game: ServerGame) {
		super(game, {
			type: CardType.SPELL,
			color: CardColor.GOLDEN,
			faction: CardFaction.ARCANE,
			features: [CardFeature.HERO_POWER, CardFeature.KEYWORD_CREATE],
			stats: {
				cost: 12
			},
			expansionSet: ExpansionSet.BASE,
		})
		this.dynamicTextVariables = {
			powerThreshold: () => this.powerThreshold,
			showPowerThreshold: () => this.powerThreshold > 0,
			thresholdDecrease: this.thresholdDecrease
		}

		this.createDeployEffectTargets()
			.target(TargetType.UNIT, () => this.allowedTargets)
			.requireAlliedUnit()
			.label(TargetType.UNIT, 'card.spellShadowArmy.target')
			.require(TargetType.UNIT, args => !this.copiedUnits.includes(args.targetCard.unit!))

		this.createEffect(GameEventType.CARD_TARGET_SELECTED_UNIT)
			.perform(({ targetUnit }) => this.onTargetSelected(targetUnit))

		this.createEffect(GameEventType.CARD_TARGETS_CONFIRMED)
			.perform(() => this.resetState())

		this.resetState()
	}

	private resetState(): void {
		this.powerThreshold = 3
		this.copiedUnits = []
	}

	private onTargetSelected(target: ServerUnit): void {
		if (target.card.stats.basePower <= this.powerThreshold && this.powerThreshold > 0) {
			this.powerThreshold -= this.thresholdDecrease
			this.allowedTargets += 1
		}

		createCardFromInstance(this, target.card)
		this.copiedUnits.push(target)
	}
}
