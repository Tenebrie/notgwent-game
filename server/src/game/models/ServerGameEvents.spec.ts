import ServerGame from './ServerGame'
import ServerOwnedCard from './ServerOwnedCard'
import TestGameTemplates from '../../utils/TestGameTemplates'
import ServerCard from './ServerCard'
import ServerGameEvents from './ServerGameEvents'
import GameEventCreators, { GameStartedEventArgs } from './events/GameEventCreators'
import ServerPlayerInGame from '../players/ServerPlayerInGame'
import GameEventType from '../../../../shared/src/enums/GameEventType'
import TestingUnitTargetsRow from '../cards/11-testing/TestingUnitTargetsRow'
import TestingUnitNoEffect from '../cards/11-testing/TestingUnitNoEffect'
import TestingSpellTacticalMove from '../cards/11-testing/TestingSpellTacticalMove'
import TestingSpellQuickStrike from '../cards/11-testing/TestingSpellQuickStrike'
import SpyInstance = jest.SpyInstance
import TestingUnitTurnEndEffectProbe from '../cards/11-testing/TestingUnitTurnEndEffectProbe'
import Utils from '../../utils/Utils'
import Constants from '@shared/Constants'
import TestingUnitTurnEndEffectProbeRight from '../cards/11-testing/TestingUnitTurnEndEffectProbeRight'

describe('ServerGameEvents', () => {
	let game: ServerGame
	let events: ServerGameEvents
	let player: ServerPlayerInGame
	let callbackSpy: () => void
	let callbackSpyB: () => void
	let callbackSpyC: () => void

	beforeEach(() => {
		game = TestGameTemplates.emptyDecks()
		events = game.events
		player = game.players[0]
		callbackSpy = jest.fn()
		callbackSpyB = jest.fn()
		callbackSpyC = jest.fn()
	})

	describe('event resolution', () => {
		it('does not resolve events immediately', () => {
			events.createCallback<GameStartedEventArgs>(game, GameEventType.GAME_STARTED).perform(() => callbackSpy())

			events.postEvent(GameEventCreators.gameStarted({ player }))

			expect(callbackSpy).toHaveBeenCalledTimes(0)
		})

		it('does not trigger callbacks for another event', () => {
			events.createCallback<GameStartedEventArgs>(game, GameEventType.ROUND_STARTED).perform(() => callbackSpy())

			events.postEvent(GameEventCreators.gameStarted({ player }))
			events.resolveEvents()

			expect(callbackSpy).toHaveBeenCalledTimes(0)
		})

		it('resolves single event from the queue', () => {
			events.createCallback<GameStartedEventArgs>(game, GameEventType.GAME_STARTED).perform(() => callbackSpy())

			events.postEvent(GameEventCreators.gameStarted({ player }))
			events.resolveEvents()

			expect(callbackSpy).toHaveBeenCalledTimes(1)
		})

		it('resolves multiple callbacks for the same event', () => {
			events.createCallback<GameStartedEventArgs>(game, GameEventType.GAME_STARTED).perform(() => callbackSpy())
			events.createCallback<GameStartedEventArgs>(game, GameEventType.GAME_STARTED).perform(() => callbackSpyB())
			events.createCallback<GameStartedEventArgs>(game, GameEventType.GAME_STARTED).perform(() => callbackSpyC())

			events.postEvent(GameEventCreators.gameStarted({ player }))
			events.resolveEvents()

			expect(callbackSpy).toHaveBeenCalledTimes(1)
			expect(callbackSpyB).toHaveBeenCalledTimes(1)
			expect(callbackSpyC).toHaveBeenCalledTimes(1)
		})

		it('resolves multiple events from the queue', () => {
			events.createCallback<GameStartedEventArgs>(game, GameEventType.GAME_STARTED).perform(() => callbackSpy())

			events.postEvent(GameEventCreators.gameStarted({ player }))
			events.postEvent(GameEventCreators.gameStarted({ player }))
			events.postEvent(GameEventCreators.gameStarted({ player }))
			events.resolveEvents()

			expect(callbackSpy).toHaveBeenCalledTimes(3)
		})

		it('resolves chaining events', () => {
			events
				.createCallback<GameStartedEventArgs>(game, GameEventType.GAME_STARTED)
				.perform(() => events.postEvent(GameEventCreators.roundStarted({ player })))
			events
				.createCallback<GameStartedEventArgs>(game, GameEventType.ROUND_STARTED)
				.perform(() => events.postEvent(GameEventCreators.roundEnded({ player })))
			events.createCallback<GameStartedEventArgs>(game, GameEventType.ROUND_ENDED).perform(() => callbackSpy())

			events.postEvent(GameEventCreators.gameStarted({ player }))
			events.resolveEvents()

			expect(callbackSpy).toHaveBeenCalledTimes(1)
		})

		describe('card resolution order', () => {
			let startNextTurn: () => void

			beforeEach(() => {
				;({ game, player, startNextTurn } = TestGameTemplates.normalGameFlow())
				events = game.events
			})

			it('prioritizes units at the front (for normal board)', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2, 0)
				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 + 1, 0)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes units at the front (for reversed board)', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 - 1, 0)
				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 - 2, 0)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes units of active player', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2, 0)
				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 - 1, 0)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes for active player', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.board.createUnit(probeCards.shift()!, 0, 0)
				game.board.createUnit(probeCards.shift()!, 0, 1)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes units on the left before units on the right', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.board.createUnit(probeCards.shift()!, 0, 0)
				game.board.createUnit(probeCards.shift()!, 0, 1)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes Board > Hand > Deck > Graveyard', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(4).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2, 0)
				game.players[1].cardHand.addUnit(probeCards.shift()!)
				game.players[1].cardDeck.addUnitToBottom(probeCards.shift()!)
				game.players[1].cardGraveyard.addUnit(probeCards.shift()!)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			describe('prioritizes left card in unit hand', () => {
				it('in normal order', () => {
					const a = new TestingUnitTurnEndEffectProbe(game)
					const b = new TestingUnitTurnEndEffectProbeRight(game)
					const spyOfA = jest.spyOn(a, 'onTurnEnd')
					const spyOfB = jest.spyOn(b, 'onTurnEnd')

					game.players[1].cardHand.addUnit(a)
					game.players[1].cardHand.addUnit(b)

					startNextTurn()

					expect(spyOfA.mock.invocationCallOrder[0]).toBeLessThan(spyOfB.mock.invocationCallOrder[0])
				})

				it('when created in reverse order', () => {
					const b = new TestingUnitTurnEndEffectProbeRight(game)
					const a = new TestingUnitTurnEndEffectProbe(game)
					const spyOfA = jest.spyOn(a, 'onTurnEnd')
					const spyOfB = jest.spyOn(b, 'onTurnEnd')

					game.players[1].cardHand.addUnit(a)
					game.players[1].cardHand.addUnit(b)

					startNextTurn()

					expect(spyOfA.mock.invocationCallOrder[0]).toBeLessThan(spyOfB.mock.invocationCallOrder[0])
				})

				it('when added to hand in reverse order', () => {
					const a = new TestingUnitTurnEndEffectProbe(game)
					const b = new TestingUnitTurnEndEffectProbeRight(game)
					const spyOfA = jest.spyOn(a, 'onTurnEnd')
					const spyOfB = jest.spyOn(b, 'onTurnEnd')

					game.players[1].cardHand.addUnit(b)
					game.players[1].cardHand.addUnit(a)

					startNextTurn()

					expect(spyOfA.mock.invocationCallOrder[0]).toBeLessThan(spyOfB.mock.invocationCallOrder[0])
				})
			})

			describe('prioritizes left card in spell hand', () => {
				it('in normal order', () => {
					const a = new TestingUnitTurnEndEffectProbe(game)
					const b = new TestingUnitTurnEndEffectProbeRight(game)
					const spyOfA = jest.spyOn(a, 'onTurnEnd')
					const spyOfB = jest.spyOn(b, 'onTurnEnd')

					game.players[1].cardHand.addSpell(a)
					game.players[1].cardHand.addSpell(b)

					startNextTurn()

					expect(spyOfA.mock.invocationCallOrder[0]).toBeLessThan(spyOfB.mock.invocationCallOrder[0])
				})

				it('when created in reverse order', () => {
					const b = new TestingUnitTurnEndEffectProbeRight(game)
					const a = new TestingUnitTurnEndEffectProbe(game)
					const spyOfA = jest.spyOn(a, 'onTurnEnd')
					const spyOfB = jest.spyOn(b, 'onTurnEnd')

					game.players[1].cardHand.addSpell(a)
					game.players[1].cardHand.addSpell(b)

					startNextTurn()

					expect(spyOfA.mock.invocationCallOrder[0]).toBeLessThan(spyOfB.mock.invocationCallOrder[0])
				})

				it('when added to hand in reverse order', () => {
					const a = new TestingUnitTurnEndEffectProbe(game)
					const b = new TestingUnitTurnEndEffectProbeRight(game)
					const spyOfA = jest.spyOn(a, 'onTurnEnd')
					const spyOfB = jest.spyOn(b, 'onTurnEnd')

					game.players[1].cardHand.addSpell(b)
					game.players[1].cardHand.addSpell(a)

					startNextTurn()

					expect(spyOfA.mock.invocationCallOrder[0]).toBeLessThan(spyOfB.mock.invocationCallOrder[0])
				})
			})

			it('prioritizes top card in deck', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.players[1].cardDeck.addUnitToBottom(probeCards.shift()!)
				game.players[1].cardDeck.addUnitToBottom(probeCards.shift()!)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes deck units over spells', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.players[1].cardDeck.addUnitToBottom(probeCards.shift()!)
				game.players[1].cardDeck.addSpellToBottom(probeCards.shift()!)

				game.players[0].endTurn()
				game.events.resolveEvents()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes top card in graveyard', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.players[1].cardGraveyard.addUnit(probeCards.shift()!)
				game.players[1].cardGraveyard.addUnit(probeCards.shift()!)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('prioritizes graveyard units over spells', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(2).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.players[1].cardGraveyard.addUnit(probeCards.shift()!)
				game.players[1].cardGraveyard.addSpell(probeCards.shift()!)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})

			it('sorts many event callbacks correctly', () => {
				const probeCards: TestingUnitTurnEndEffectProbe[] = Utils.shuffle(
					new Array(24).fill(0).map(() => new TestingUnitTurnEndEffectProbe(game))
				)
				const spies = probeCards.map((card) => jest.spyOn(card, 'onTurnEnd'))

				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2, 0)
				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 + 1, 0)
				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 + 2, 0)
				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 + 2, 1)
				game.board.createUnit(probeCards.shift()!, Constants.GAME_BOARD_ROW_COUNT / 2 + 2, 2)
				game.players[0].cardHand.addUnit(probeCards.shift()!)
				game.players[0].cardDeck.addUnitToBottom(probeCards.shift()!)
				game.players[0].cardDeck.addUnitToBottom(probeCards.shift()!)
				game.players[0].cardGraveyard.addUnit(probeCards.shift()!)
				game.players[0].cardGraveyard.addUnit(probeCards.shift()!)
				game.players[0].cardGraveyard.addSpell(probeCards.shift()!)
				game.players[0].cardGraveyard.addSpell(probeCards.shift()!)

				game.board.createUnit(probeCards.shift()!, 2, 0)
				game.board.createUnit(probeCards.shift()!, 1, 0)
				game.board.createUnit(probeCards.shift()!, 0, 0)
				game.board.createUnit(probeCards.shift()!, 0, 1)
				game.board.createUnit(probeCards.shift()!, 0, 2)
				game.players[1].cardHand.addUnit(probeCards.shift()!)
				game.players[1].cardDeck.addUnitToBottom(probeCards.shift()!)
				game.players[1].cardDeck.addUnitToBottom(probeCards.shift()!)
				game.players[1].cardGraveyard.addUnit(probeCards.shift()!)
				game.players[1].cardGraveyard.addUnit(probeCards.shift()!)
				game.players[1].cardGraveyard.addSpell(probeCards.shift()!)
				game.players[1].cardGraveyard.addSpell(probeCards.shift()!)

				startNextTurn()

				for (let i = 0; i < spies.length - 1; i++) {
					expect(spies[i].mock.invocationCallOrder[0]).toBeLessThan(spies[i + 1].mock.invocationCallOrder[0])
				}
			})
		})

		describe('card resolution without targeting', () => {
			let cardInHand: ServerCard
			let resolutionStackSpy: SpyInstance
			let ownedCard: ServerOwnedCard

			beforeEach(() => {
				;({ game, cardInHand, player, ownedCard } = TestGameTemplates.singleCardTest(TestingUnitNoEffect))
				events = game.events
				resolutionStackSpy = jest.spyOn(game.cardPlay.cardResolveStack, 'finishResolving')
			})

			it('pops card resolution stack', () => {
				game.cardPlay.cardResolveStack.startResolving(ownedCard, () => game.cardPlay.updateResolvingCardTargetingStatus())

				events.resolveEvents()

				expect(resolutionStackSpy).toHaveBeenCalled()
				expect(game.cardPlay.cardResolveStack.cards.length).toEqual(0)
			})

			it('resolves multiple cards', () => {
				const ownedCards = [
					{
						card: cardInHand,
						owner: player,
					},
					{
						card: new TestingUnitNoEffect(game),
						owner: player,
					},
					{
						card: new TestingUnitNoEffect(game),
						owner: player,
					},
					{
						card: new TestingUnitNoEffect(game),
						owner: player,
					},
					{
						card: new TestingUnitNoEffect(game),
						owner: player,
					},
					{
						card: new TestingUnitNoEffect(game),
						owner: player,
					},
				]
				ownedCards.forEach((card) => {
					game.cardPlay.cardResolveStack.startResolving(card, () => game.cardPlay.updateResolvingCardTargetingStatus())
				})

				events.resolveEvents()

				expect(resolutionStackSpy).toHaveBeenCalledTimes(6)
				expect(game.cardPlay.cardResolveStack.cards.length).toEqual(0)
			})
		})

		describe('card resolution with simple targeting', () => {
			let ownedCard: ServerOwnedCard
			let resolutionStackSpy: SpyInstance

			beforeEach(() => {
				;({ game, player, ownedCard } = TestGameTemplates.singleCardTest(TestingSpellQuickStrike))
				events = game.events
				resolutionStackSpy = jest.spyOn(game.cardPlay.cardResolveStack, 'finishResolving')
			})

			it('switches targeting to next card in queue', () => {
				game.board.createUnit(new TestingUnitNoEffect(game), 4, 0)

				const valkyrie = new TestingUnitTargetsRow(game)
				player.cardHand.addUnit(valkyrie)

				game.cardPlay.forcedPlayCardFromHand(ownedCard, 0, 0)
				events.resolveEvents()
				game.cardPlay.forcedPlayCardFromHand({ card: valkyrie, owner: player }, 0, 0)
				events.resolveEvents()
				game.cardPlay.selectCardTarget(player, game.cardPlay.getDeployTargets()[0].target)
				events.resolveEvents()

				expect(resolutionStackSpy).toHaveBeenCalledTimes(1)
				expect(game.board.getAllUnits().length).toEqual(2)
				expect(game.cardPlay.cardResolveStack.cards.length).toEqual(1)
				expect(game.cardPlay.cardResolveStack.cards[0].card.class).toEqual('testingUnitTargetsRow')
			})
		})

		describe('multistage card targeting', () => {
			let ownedCard: ServerOwnedCard
			let resolutionStackSpy: SpyInstance

			beforeEach(() => {
				;({ game, player, ownedCard } = TestGameTemplates.singleCardTest(TestingSpellTacticalMove))
				events = game.events
				resolutionStackSpy = jest.spyOn(game.cardPlay.cardResolveStack, 'finishResolving')
				game.board.createUnit(new TestingUnitNoEffect(game), 0, 0)
			})

			it('keeps card resolving after first target', () => {
				game.cardPlay.forcedPlayCardFromHand(ownedCard, 0, 0)
				events.resolveEvents()
				game.cardPlay.selectCardTarget(player, game.cardPlay.getDeployTargets()[0].target)
				events.resolveEvents()

				expect(resolutionStackSpy).toHaveBeenCalledTimes(0)
				expect(game.cardPlay.cardResolveStack.cards.length).toEqual(1)
				expect(game.cardPlay.cardResolveStack.cards[0].card.class).toEqual('testingSpellTacticalMove')
			})

			it('resolves card after second target', () => {
				game.cardPlay.forcedPlayCardFromHand(ownedCard, 0, 0)
				events.resolveEvents()
				game.cardPlay.selectCardTarget(player, game.cardPlay.getDeployTargets()[0].target)
				events.resolveEvents()
				game.cardPlay.selectCardTarget(player, game.cardPlay.getDeployTargets()[0].target)
				events.resolveEvents()

				expect(resolutionStackSpy).toHaveBeenCalledTimes(1)
				expect(game.cardPlay.cardResolveStack.cards.length).toEqual(0)
			})
		})
	})
})
