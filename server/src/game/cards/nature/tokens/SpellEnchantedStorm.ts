import CardType from '@shared/enums/CardType'
import ServerCard from '../../../models/ServerCard'
import ServerGame from '../../../models/ServerGame'
import ServerPlayerInGame from '../../../players/ServerPlayerInGame'
import TargetDefinitionBuilder from '../../../models/targetDefinitions/TargetDefinitionBuilder'
import ServerUnit from '../../../models/ServerUnit'
import CardColor from '@shared/enums/CardColor'
import TargetType from '@shared/enums/TargetType'
import CardFaction from '@shared/enums/CardFaction'
import PostPlayTargetDefinitionBuilder from '../../../models/targetDefinitions/PostPlayTargetDefinitionBuilder'
import ServerAnimation from '../../../models/ServerAnimation'
import CardTribe from '@shared/enums/CardTribe'
import BuffStrength from '../../../buffs/BuffStrength'
import BuffDuration from '@shared/enums/BuffDuration'
import BuffUpgradedStorms from '../../../buffs/BuffUpgradedStorms'

export default class SpellEnchantedStorm extends ServerCard {
	baseBuffPower = 1
	targetCount = 3
	powerPerStorm = 1
	targetsHit = []

	constructor(game: ServerGame) {
		super(game, CardType.SPELL, CardColor.TOKEN, CardFaction.NATURE)

		this.basePower = 0
		this.baseTribes = [CardTribe.STORM]
		this.dynamicTextVariables = {
			buffPower: () => this.buffPower,
			targetCount: this.targetCount,
			powerPerStorm: this.powerPerStorm,
			isUpgraded: () => this.isUpgraded()
		}
	}

	get buffPower(): number {
		let stormsPlayed = 0
		if (this.owner) {
			stormsPlayed = this.owner.cardGraveyard.findCardsByTribe(CardTribe.STORM).length
		}
		return this.baseBuffPower + this.powerPerStorm * stormsPlayed
	}

	definePostPlayRequiredTargets(): TargetDefinitionBuilder {
		const builder = PostPlayTargetDefinitionBuilder.base(this.game)
			.multipleTargets(this.targetCount)
			.allow(TargetType.UNIT, this.targetCount)
			.alliedUnit()
		if (!this.isUpgraded()) {
			builder.validate(TargetType.UNIT, args => !this.targetsHit.includes(args.targetUnit))
		}
		return builder
	}

	onSpellPlayTargetUnitSelected(owner: ServerPlayerInGame, target: ServerUnit): void {
		this.game.animation.play(ServerAnimation.universeAttacksUnits([target]))
		target.buffs.addMultiple(BuffStrength, this.buffPower, this, BuffDuration.INFINITY)
		this.targetsHit.push(target)
	}

	onSpellPlayTargetsConfirmed(): void {
		this.targetsHit = []
	}

	private isUpgraded(): boolean {
		return this.owner && this.owner.leader.buffs.has(BuffUpgradedStorms)
	}
}