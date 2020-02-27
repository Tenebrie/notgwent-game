import Core from '@/Pixi/Core'
import RenderedCard from '@/Pixi/board/RenderedCard'
import { CardLocation } from '@/Pixi/enums/CardLocation'
import ClientPlayerInGame from '@/Pixi/models/ClientPlayerInGame'
import RenderedUnit from '@/Pixi/board/RenderedUnit'

export default class HoveredCard {
	card: RenderedCard
	location: CardLocation
	owner: ClientPlayerInGame

	constructor(card: RenderedCard, location: CardLocation, owner: ClientPlayerInGame) {
		this.card = card
		this.location = location
		this.owner = owner
	}

	public static fromCardInHand(card: RenderedCard, owner: ClientPlayerInGame): HoveredCard {
		return new HoveredCard(card, CardLocation.HAND, owner)
	}

	public static fromCardOnBoard(cardOnBoard: RenderedUnit): HoveredCard {
		return new HoveredCard(cardOnBoard.card, CardLocation.BOARD, cardOnBoard.owner)
	}

	public static fromAnnouncedCard(card: RenderedCard): HoveredCard {
		return new HoveredCard(card, CardLocation.ANNOUNCED, Core.opponent)
	}
}
