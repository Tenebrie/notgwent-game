import ServerGame from './ServerGame'
import Constants from '@shared/Constants'
import ServerUnit from './ServerUnit'
import Board from '@shared/models/Board'
import ServerBoardRow from './ServerBoardRow'
import OutgoingMessageHandlers from '../handlers/OutgoingMessageHandlers'
import ServerPlayerInGame from '../players/ServerPlayerInGame'
import ServerBoardOrders from './ServerBoardOrders'
import ServerCard from './ServerCard'
import { toRowIndex } from '@src/utils/Utils'
import MoveDirection from '@shared/enums/MoveDirection'
import GameEventCreators from './events/GameEventCreators'
import ServerAnimation from './ServerAnimation'
import GameHookType, { UnitDestroyedHookArgs, UnitDestroyedHookValues } from './events/GameHookType'
import CardFeature from '@shared/enums/CardFeature'
import CardType from '@shared/enums/CardType'
import CardTribe from '@shared/enums/CardTribe'
import ServerPlayerGroup from '@src/game/players/ServerPlayerGroup'

export default class ServerBoard implements Board {
	readonly game: ServerGame
	readonly rows: ServerBoardRow[]
	readonly orders: ServerBoardOrders
	readonly unitsBeingDestroyed: ServerUnit[]

	constructor(game: ServerGame) {
		this.game = game
		this.rows = []
		this.orders = new ServerBoardOrders(game)
		this.unitsBeingDestroyed = []
		for (let i = 0; i < game.ruleset.constants.GAME_BOARD_ROW_COUNT; i++) {
			this.rows.push(new ServerBoardRow(game, i))
		}
	}

	public findUnitById(cardId: string): ServerUnit | undefined {
		const cards = this.rows.flatMap((row) => row.cards)
		return cards.find((cardOnBoard) => cardOnBoard.card.id === cardId)
	}

	public isExtraUnitPlayableToRow(rowIndex: number): boolean {
		const rulesetConstants = this.game.ruleset.constants
		if (rowIndex < 0 || rowIndex >= rulesetConstants.GAME_BOARD_ROW_COUNT) {
			return false
		}
		return this.rows[rowIndex].cards.length < Constants.MAX_CARDS_PER_ROW
	}

	public getRowWithUnit(targetUnit: ServerUnit): ServerBoardRow | null {
		return this.rows.find((row) => !!row.cards.find((unit) => unit.card.id === targetUnit.card.id)) || null
	}

	public getControlledRows(player: ServerPlayerInGame | ServerPlayerGroup | null): ServerBoardRow[] {
		if (!player) {
			return []
		}
		const rows = this.rows.filter(
			(row) =>
				(player instanceof ServerPlayerGroup && row.owner === player) ||
				(player instanceof ServerPlayerInGame && row.owner && row.owner.players.includes(player))
		)
		if (player.isInvertedBoard()) {
			rows.reverse()
		}
		return rows
	}

	public getAdjacentRows(targetRow: ServerBoardRow): ServerBoardRow[] {
		const adjacentRows = []
		if (targetRow.index > 0) {
			adjacentRows.push(this.game.board.rows[targetRow.index - 1])
		}
		const rulesetConstants = this.game.ruleset.constants
		if (targetRow.index < rulesetConstants.GAME_BOARD_ROW_COUNT - 1) {
			adjacentRows.push(this.game.board.rows[targetRow.index + 1])
		}
		return adjacentRows
	}

	public getTotalPlayerPower(playerGroup: ServerPlayerGroup | null): number {
		if (!playerGroup) {
			return 0
		}
		const leaderPower = playerGroup.players
			.map((player) => player.leader)
			.map((card) => card.stats.power)
			.reduce((total, value) => total + value, 0)
		const boardPower = this.getUnitsOwnedByGroup(playerGroup)
			.map((unit) => unit.card.stats.power)
			.reduce((total, value) => total + value, 0)
		return leaderPower + boardPower
	}

	public getHorizontalUnitDistance(first: ServerUnit, second: ServerUnit): number {
		const firstOffsetFromCenter = first.unitIndex - (this.rows[first.rowIndex].cards.length - 1) / 2
		const secondOffsetFromCenter = second.unitIndex - (this.rows[second.rowIndex].cards.length - 1) / 2
		return Math.abs(firstOffsetFromCenter - secondOffsetFromCenter)
	}

	public getVerticalUnitDistance(firstUnit: ServerUnit, secondUnit: ServerUnit): number {
		const firstUnitRowIndex = firstUnit.rowIndex
		const secondUnitRowIndex = secondUnit.rowIndex
		const smallIndex = Math.min(firstUnitRowIndex, secondUnitRowIndex)
		const largeIndex = Math.max(firstUnitRowIndex, secondUnitRowIndex)
		if (smallIndex === largeIndex) {
			return 0
		}

		const obstacleRows = []
		for (let i = smallIndex + 1; i < largeIndex; i++) {
			const row = this.rows[i]
			if (row.cards.length > 0) {
				obstacleRows.push(row)
			}
		}

		return obstacleRows.length + 1
	}

	public getAllUnits(): ServerUnit[] {
		return this.rows.flatMap((row) => row.cards)
	}

	public isUnitAdjacent(first: ServerUnit | null, second: ServerUnit | null): boolean {
		if (!first || !second) {
			return false
		}
		// return this.getHorizontalUnitDistance(first, second) <= 1 && first.rowIndex === second.rowIndex && first !== second
		return first.rowIndex === second.rowIndex && Math.abs(first.unitIndex - second.unitIndex) === 1
	}

	public getAdjacentUnits(reference: ServerUnit | { targetRow: ServerBoardRow; targetPosition: number } | null): ServerUnit[] {
		if (!reference) {
			return []
		}

		let row: ServerBoardRow
		let unitIndex: number
		let requiredDistances: number[]

		if (reference instanceof ServerUnit) {
			row = this.rows[reference.rowIndex]
			unitIndex = reference.unitIndex
			requiredDistances = [1]
		} else {
			row = reference.targetRow
			unitIndex = reference.targetPosition
			requiredDistances = [0, 1]
		}
		return row.cards.filter((card) => requiredDistances.includes(Math.abs(card.unitIndex - unitIndex)))
	}

	public getOpposingUnits(thisUnit: ServerUnit): ServerUnit[] {
		return this.game.board
			.getUnitsOwnedByOpponent(thisUnit.card.ownerInGame)
			.filter((unit) => this.game.board.getHorizontalUnitDistance(unit, thisUnit) < 1)
			.sort((a, b) => {
				return this.game.board.getVerticalUnitDistance(a, thisUnit) - this.game.board.getVerticalUnitDistance(b, thisUnit)
			})
	}

	public getClosestOpposingUnits(thisUnit: ServerUnit): ServerUnit[] {
		const opposingEnemies = this.getOpposingUnits(thisUnit)
		if (opposingEnemies.length === 0) {
			return []
		}
		const shortestDistance = this.getVerticalUnitDistance(opposingEnemies[0], thisUnit)
		return opposingEnemies.filter((unit) => this.getVerticalUnitDistance(unit, thisUnit) === shortestDistance)
	}

	public getUnitsOwnedByGroup(owner: ServerPlayerGroup | null): ServerUnit[] {
		if (!owner) {
			return []
		}
		return this.getAllUnits().filter((unit) => unit.owner === owner)
	}

	public getUnitsOwnedByOpponent(context: ServerCard | ServerPlayerInGame | ServerPlayerGroup | null): ServerUnit[] {
		if (!context) {
			return []
		}
		const playerGroup: ServerPlayerGroup =
			context instanceof ServerPlayerGroup ? context : context instanceof ServerCard ? context.ownerGroupInGame : context.group
		return this.getUnitsOwnedByGroup(playerGroup.opponent)
	}

	public getUnitsOfTribe(tribe: CardTribe, player: ServerPlayerGroup | null): ServerUnit[] {
		return this.getUnitsOwnedByGroup(player).filter((unit) => unit.card.tribes.includes(tribe))
	}

	public getMoveDirection(player: ServerPlayerGroup, from: ServerBoardRow, to: ServerBoardRow): MoveDirection {
		let direction = from.index - to.index
		if (player.isInvertedBoard()) {
			direction *= -1
		}
		if (direction > 0) {
			return MoveDirection.FORWARD
		} else if (direction < 0) {
			return MoveDirection.BACK
		} else {
			return MoveDirection.SIDE
		}
	}

	public rowMove(player: ServerPlayerGroup, fromRowIndex: number, direction: MoveDirection, distance: number): number {
		if (direction === MoveDirection.SIDE) {
			return fromRowIndex
		}

		let scalar = 1
		if (direction === MoveDirection.BACK) {
			scalar *= -1
		}
		if (!player.isInvertedBoard()) {
			scalar *= -1
		}

		const rulesetConstants = this.game.ruleset.constants
		return Math.max(0, Math.min(fromRowIndex + distance * scalar, rulesetConstants.GAME_BOARD_ROW_COUNT - 1))
	}

	public getRowDistance(rowA: ServerBoardRow, rowB: ServerBoardRow): number {
		return Math.abs(rowA.index - rowB.index)
	}

	public getDistanceToStaticFront(rowIndex: number): number {
		const targetRow = this.rows[rowIndex]
		const player = targetRow.owner
		let playerRows = this.rows.filter((row) => row.owner === player)
		if (player && player.isInvertedBoard()) {
			playerRows = playerRows.reverse()
		}
		return playerRows.indexOf(targetRow)
	}

	public getDistanceToDynamicFrontForPlayer(rowOrIndex: number | ServerBoardRow, player: ServerPlayerGroup): number {
		const rowIndex = toRowIndex(rowOrIndex)
		const targetRow = this.rows[rowIndex]
		const distanceToStaticFront = this.getDistanceToStaticFront(rowIndex)
		if (player !== targetRow.owner) {
			return distanceToStaticFront
		}

		let result = distanceToStaticFront
		for (let i = 0; i < distanceToStaticFront; i++) {
			const potentialRow = this.getRowWithDistanceToFront(player, i)
			if (potentialRow.cards.length === 0) {
				result -= 1
			}
		}
		return result
	}

	public getRowWithDistanceToFront(player: ServerPlayerInGame | ServerPlayerGroup, distance: number): ServerBoardRow {
		if (player instanceof ServerPlayerInGame) {
			player = player.group
		}
		let playerRows = this.rows.filter((row) => row.owner === player)
		if (player.isInvertedBoard()) {
			playerRows = playerRows.reverse()
		}
		const targetRow = playerRows[Math.min(playerRows.length - 1, distance)]
		if (!targetRow) {
			throw new Error(`No row owned by player at distance ${distance}!`)
		}
		return targetRow
	}

	public createUnit(card: ServerCard, createdBy: ServerPlayerInGame, rowIndex: number, unitIndex: number): ServerUnit | null {
		const targetRow = this.rows[rowIndex]
		return targetRow.createUnit(card, createdBy, unitIndex)
	}

	public moveUnit(unit: ServerUnit, rowIndex: number, unitIndex: number): void {
		if (unit.rowIndex === rowIndex && unit.unitIndex === unitIndex) {
			return
		}

		const rulesetConstants = this.game.ruleset.constants
		if (rowIndex < 0 || rowIndex >= rulesetConstants.GAME_BOARD_ROW_COUNT) {
			return
		}

		const fromRow = this.rows[unit.rowIndex]
		const fromIndex = unit.unitIndex
		const targetRow = this.rows[rowIndex]

		if (fromRow.owner !== targetRow.owner || targetRow.cards.length >= Constants.MAX_CARDS_PER_ROW) {
			return
		}

		fromRow.removeUnitLocally(unit)
		targetRow.insertUnitLocally(unit, unitIndex)
		OutgoingMessageHandlers.notifyAboutUnitMoved(unit)

		this.game.animation.play(ServerAnimation.unitMove())
		this.game.events.postEvent(
			GameEventCreators.unitMoved({
				game: this.game,
				triggeringUnit: unit,
				fromRow: fromRow,
				fromIndex: fromIndex,
				toRow: this.rows[unit.rowIndex],
				toIndex: unit.unitIndex,
				distance: this.getRowDistance(fromRow, targetRow),
				direction: this.getMoveDirection(unit.owner, fromRow, targetRow),
			})
		)
	}

	public moveUnitForward(unit: ServerUnit, distance = 1): void {
		if (this.getDistanceToStaticFront(unit.rowIndex) === 0) {
			return
		}
		this.moveUnitToFarRight(unit, this.game.board.rowMove(unit.owner, unit.rowIndex, MoveDirection.FORWARD, distance))
	}

	public moveUnitBack(unit: ServerUnit, distance = 1): void {
		const rowsOwnedByPlayer = this.rows.filter((row) => row.owner === unit.owner).length
		if (this.getDistanceToStaticFront(unit.rowIndex) === rowsOwnedByPlayer - 1) {
			return
		}
		this.moveUnitToFarRight(unit, this.game.board.rowMove(unit.owner, unit.rowIndex, MoveDirection.BACK, distance))
	}

	public moveUnitToFarLeft(unit: ServerUnit, rowIndex: number): void {
		return this.moveUnit(unit, rowIndex, 0)
	}

	public moveUnitToFarRight(unit: ServerUnit, rowIndex: number): void {
		return this.moveUnit(unit, rowIndex, this.rows[rowIndex].cards.length)
	}

	/* Remove this unit from the board
	 * -------------------------------
	 * Target unit is removed from the board. Client is notified.
	 */
	public removeUnit(unit: ServerUnit): void {
		const rowWithCard = this.getRowWithUnit(unit)
		if (!rowWithCard) {
			console.error(`No row includes unit ${unit.card.id}`)
			return
		}

		rowWithCard.removeUnit(unit)
	}

	/* Destroy this unit
	 * -----------------
	 * Target unit is destroyed and removed from the board.
	 * The associated card is then cleansed and transferred to the owner's graveyard with 0 Power.
	 */
	public destroyUnit(unit: ServerUnit, destroyer?: ServerCard): void {
		if (this.unitsBeingDestroyed.includes(unit)) {
			return
		}

		this.unitsBeingDestroyed.push(unit)

		const card = unit.card

		const hookValues = this.game.events.applyHooks<UnitDestroyedHookValues, UnitDestroyedHookArgs>(
			GameHookType.UNIT_DESTROYED,
			{
				destructionPrevented: false,
			},
			{
				targetUnit: unit,
			}
		)
		if (hookValues.destructionPrevented) {
			card.stats.power = 0
			this.unitsBeingDestroyed.splice(this.unitsBeingDestroyed.indexOf(unit), 1)
			return
		}

		if (destroyer) {
			this.game.animation.play(ServerAnimation.cardAffectsCards(destroyer, [unit.card]))
		}

		this.game.events.postEvent(
			GameEventCreators.unitDestroyed({
				game: this.game,
				triggeringCard: unit.card,
				triggeringUnit: unit,
			})
		)

		this.game.animation.play(ServerAnimation.unitDestroy(card))
		// card.cleanse()
		this.removeUnit(unit)

		if (card.features.includes(CardFeature.HERO_POWER)) {
			card.cleanse()
			// card.stats.power = card.stats.basePower
			unit.originalOwner.cardDeck.addSpellToTop(card)
		} else if (card.type === CardType.UNIT) {
			unit.originalOwner.cardGraveyard.addUnit(card)
		} else if (card.type === CardType.SPELL) {
			unit.originalOwner.cardGraveyard.addSpell(card)
		}

		this.unitsBeingDestroyed.splice(this.unitsBeingDestroyed.indexOf(unit), 1)
	}
}
