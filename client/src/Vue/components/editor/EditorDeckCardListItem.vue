<template>
	<div
		class="editor-deck-card-list-item"
		:class="colorClass"
		@click="onClick"
		@contextmenu="onRightClick"
		@mouseenter="onMouseEnter"
		@mouseleave="onMouseLeave"
	>
		<span class="power" v-if="showPower">{{ card.stats.basePower }}</span>
		<span class="name"
			>{{ fullName }}<span class="count" v-if="displayCount">x{{ card.count }}</span></span
		>
	</div>
</template>

<script lang="ts">
import * as PIXI from 'pixi.js'
import store from '@/Vue/store'
import Localization from '@/Pixi/Localization'
import CardColor from '@shared/enums/CardColor'
import { getMaxCardCopiesForColor } from '@shared/Utils'
import { defineComponent, PropType } from 'vue'
import PopulatedEditorCard from '@shared/models/PopulatedEditorCard'

export default defineComponent({
	props: {
		card: {
			type: Object as PropType<PopulatedEditorCard>,
			required: true,
		},
	},

	computed: {
		fullName(): string {
			const listName = Localization.getValueOrNull(this.card.listName)
			if (listName) {
				return listName
			}
			let name = Localization.get(this.card.name)
			const title = Localization.getValueOrNull(this.card.title)
			if (title) {
				name = `${name}, ${title}`
			}
			return name
		},

		showPower(): boolean {
			return this.card.color !== CardColor.LEADER
		},

		displayCount(): boolean {
			return getMaxCardCopiesForColor(this.card.color) > 1
		},

		colorClass(): any {
			return {
				leader: this.card.color === CardColor.LEADER,
				golden: this.card.color === CardColor.GOLDEN,
				silver: this.card.color === CardColor.SILVER,
				bronze: this.card.color === CardColor.BRONZE,
			}
		},
	},

	methods: {
		onClick(): void {
			const deckId = this.$route.params.deckId as string
			store.dispatch.editor.removeCardFromDeck({
				deckId: deckId,
				cardToRemove: this.card,
			})
			if (!store.getters.editor.deck(deckId)!.cards.find((card) => card.id === this.card.id)) {
				store.commit.editor.hoveredDeckCard.setCard(null)
			}
		},

		onRightClick(): void {
			store.dispatch.inspectedCard.clear()
			store.dispatch.inspectedCard.setCard({
				card: this.card,
			})
		},

		onMouseEnter(): void {
			const element = this.$el
			const boundingBox = element.getBoundingClientRect()
			store.dispatch.editor.hoveredDeckCard.setCard({
				card: this.card,
				position: new PIXI.Point(boundingBox.left, boundingBox.top),
				scrollCallback: () => this.onParentScroll(),
			})
		},

		onParentScroll(): void {
			this.onMouseLeave()
		},

		onMouseLeave(): void {
			store.commit.editor.hoveredDeckCard.setCard(null)
		},
	},
})
</script>

<style scoped lang="scss">
@import '../../styles/generic';

.editor-deck-card-list-item {
	width: calc(100% - 16px);
	display: flex;
	flex-direction: row;
	padding: 4px 8px;
	cursor: pointer;
	user-select: none;
	font-size: 1.3em;
	transition: background-color 0.3s;

	&:hover {
		background: $COLOR-BACKGROUND-TRANSPARENT;
		transition: background-color 0s;
	}

	&.leader {
		color: MediumAquamarine;
	}

	&.golden {
		color: orange;
	}

	&.silver {
		color: #bb20bb;
	}

	.power {
		min-width: 25px;
		margin-right: 20px;
		text-align: right;
	}

	.name {
		text-align: left;
	}

	.count {
		margin-left: 4px;
	}
}
</style>
