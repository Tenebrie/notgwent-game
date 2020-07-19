enum GameEventType {
	EFFECT_UNIT_DEPLOY = 'effectUnitDeploy',
	EFFECT_SPELL_PLAY = 'effectSpellPlay',
	EFFECT_TARGET_SELECTED = 'effectTargetSelected',
	EFFECT_TARGETS_CONFIRMED = 'effectTargetsConfirmed',

	ROUND_STARTED = 'roundStarted',
	TURN_STARTED = 'turnStarted',

	CARD_DRAWN = 'cardDrawn',
	CARD_PLAYED = 'cardPlayed',
	CARD_RESOLVED = 'cardResolved',
	CARD_TAKES_DAMAGE = 'cardTakesDamage',
	CARD_DESTROYED = 'cardDestroyed',

	UNIT_CREATED = 'unitCreated',
	UNIT_DESTROYED = 'unitDestroyed',

	TURN_ENDED = 'turnEnded',
	ROUND_ENDED = 'roundEnded',
}

export default GameEventType