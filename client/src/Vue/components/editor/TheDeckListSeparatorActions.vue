<template>
	<div class="editor-deck-card-list-separator-unfinished">
		<span class="line-container left"><span class="line"></span></span>
		<span class="text">{{ separatorText }}</span>
		<span class="line-container right"><span class="line"></span></span>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
	computed: {
		separatorText(): string {
			return 'Actions'
		},
	},
})
</script>

<style scoped lang="scss">
@import '../../styles/generic';

.editor-deck-card-list-separator-unfinished {
	width: calc(100% - 16px);
	display: flex;
	flex-direction: row;
	padding: 4px 8px;
	user-select: none;
	font-size: 1.1em;

	color: darken(white, 10);
	.line {
		background: darken(white, 10);
	}

	.text {
		display: inline-block;
		margin: 0 8px;
	}

	.line-container.left {
		width: 30px;
	}

	.line-container.right {
		flex: 1;
	}

	.line-container {
		width: 100px;
		display: flex;
		flex-direction: column;
		justify-content: center;

		.line {
			width: 100%;
			border-radius: 2px;
			height: 4px;
			display: block;
		}
	}
}
</style>
