enum AnimationType {
	NULL,
	DELAY,
	CARD_DRAW,
	CARD_ANNOUNCE,
	CARD_ATTACK,
	ROW_ATTACK,
	CARD_AFFECT,
	CARD_HEAL,
	CARD_AFFECTS_ROWS,
	ROW_AFFECTS_CARDS,
	ROW_HEALS_CARDS,
	ROW_AFFECTS_ROWS,
	POST_CARD_ATTACK,
	UNIVERSE_ATTACK,
	UNIVERSE_AFFECT,
	UNIVERSE_HEAL,
	UNIT_DEPLOY,
	UNIT_DESTROY,
	UNIT_MOVE,
	CARD_RECEIVED_BUFF,
	ROWS_RECEIVED_BUFF,
	CARD_INFUSE,
	CARD_GENERATE_MANA,
}

export default AnimationType
