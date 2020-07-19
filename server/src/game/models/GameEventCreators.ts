import GameEventType from '@shared/enums/GameEventType'
import ServerPlayerInGame from '../players/ServerPlayerInGame'
import ServerCard from './ServerCard'
import ServerUnit from './ServerUnit'
import ServerDamageInstance from './ServerDamageSource'
import DamageSource from '@shared/enums/DamageSource'
import ServerBoardRow from './ServerBoardRow'

export default {
	effectUnitDeploy: (): GameEvent => ({
		type: GameEventType.EFFECT_UNIT_DEPLOY,
		args: {}
	}),
	effectSpellPlay: (): GameEvent => ({
		type: GameEventType.EFFECT_SPELL_PLAY,
		args: {}
	}),
	effectTargetSelected: (args: EffectTargetSelectedEventArgs): GameEvent => ({
		type: GameEventType.EFFECT_TARGET_SELECTED,
		args: args
	}),
	effectTargetsConfirmed: (): GameEvent => ({
		type: GameEventType.EFFECT_TARGETS_CONFIRMED,
		args: {}
	}),

	roundStarted: (args: RoundStartedEventArgs): GameEvent => ({
		type: GameEventType.ROUND_STARTED,
		args: args
	}),
	turnStarted: (args: TurnStartedEventArgs): GameEvent => ({
		type: GameEventType.TURN_STARTED,
		args: args
	}),

	cardDrawn: (args: CardDrawnEventArgs): GameEvent => ({
		type: GameEventType.CARD_DRAWN,
		args: args
	}),
	cardPlayed: (args: CardPlayedEventArgs): GameEvent => ({
		type: GameEventType.CARD_PLAYED,
		args: args,
		logVariables: {
			owner: args.owner.player.id,
			triggeringCard: args.triggeringCard.id
		}
	}),
	cardResolved: (args: CardResolvedEventArgs): GameEvent => ({
		type: GameEventType.CARD_RESOLVED,
		args: args,
		logVariables: {
			triggeringCard: args.triggeringCard.id
		}
	}),
	cardTakesDamage: (args: CardTakesDamageEventArgs): GameEvent => ({
		type: GameEventType.CARD_TAKES_DAMAGE,
		args: args,
		logSubtype: args.damageInstance.source === DamageSource.CARD ? 'fromCard' : 'fromUniverse',
		logVariables: {
			damage: args.damageInstance.value,
			sourceCard: args.damageInstance.sourceCard ? args.damageInstance.sourceCard.id : '',
			triggeringCard: args.triggeringCard.id
		}
	}),
	cardDestroyed: (args: CardDestroyedEventArgs): GameEvent => ({
		type: GameEventType.CARD_DESTROYED,
		args: args,
		logVariables: {
			triggeringCard: args.triggeringCard.id
		}
	}),

	unitCreated: (args: UnitCreatedEventArgs): GameEvent => ({
		type: GameEventType.UNIT_CREATED,
		args: args,
		logVariables: {
			triggeringUnit: args.triggeringUnit.card.id
		}
	}),
	unitDestroyed: (args: UnitDestroyedEventArgs): GameEvent => ({
		type: GameEventType.UNIT_DESTROYED,
		args: args,
		logVariables: {
			triggeringUnit: args.triggeringUnit.card.id
		}
	}),

	turnEnded: (args: TurnEndedEventArgs): GameEvent => ({
		type: GameEventType.TURN_ENDED,
		args: args
	}),
	roundEnded: (args: RoundEndedEventArgs): GameEvent => ({
		type: GameEventType.ROUND_ENDED,
		args: args
	}),
}

export interface GameEvent {
	type: GameEventType
	args: Record<string, any>
	logSubtype?: string
	logVariables?: Record<string, any>
}

export interface EffectTargetSelectedEventArgs {
	targetCard: ServerCard
	targetUnit: ServerUnit
	targetRow: ServerBoardRow
}

export interface RoundStartedEventArgs {
	player: ServerPlayerInGame
}
export interface TurnStartedEventArgs {
	player: ServerPlayerInGame
}

export interface CardDrawnEventArgs {
	triggeringCard: ServerCard
}
export interface CardPlayedEventArgs {
	owner: ServerPlayerInGame
	triggeringCard: ServerCard
}
export interface CardResolvedEventArgs {
	triggeringCard: ServerCard
}
export interface CardTakesDamageEventArgs {
	triggeringCard: ServerCard
	damageInstance: ServerDamageInstance
	armorDamageInstance: ServerDamageInstance | null
	powerDamageInstance: ServerDamageInstance | null
}
export interface CardDestroyedEventArgs {
	triggeringCard: ServerCard
}

export interface UnitCreatedEventArgs {
	triggeringUnit: ServerUnit
}
export interface UnitDestroyedEventArgs {
	triggeringUnit: ServerUnit
}

export interface TurnEndedEventArgs {
	player: ServerPlayerInGame
}
export interface RoundEndedEventArgs {
	player: ServerPlayerInGame
}