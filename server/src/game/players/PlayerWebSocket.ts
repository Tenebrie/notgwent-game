import * as ws from 'ws'
import ServerGame from '../models/ServerGame'
import lzutf8 from 'lzutf8'
import { compressGameTraffic } from '@shared/Utils'

export default class PlayerWebSocket {
	ws: ws
	game: ServerGame

	constructor(webSocket: ws, game: ServerGame) {
		this.ws = webSocket
		this.game = game
	}

	send(json: Record<string, any>): void {
		if (this.ws.readyState != 1) {
			return
		}

		let data = JSON.stringify(json)
		data = data.replace(/buff:[a-zA-Z_0-9]+:/g, 'buff:redacted:')
		data = data.replace(/card:[a-zA-Z_0-9]+:/g, 'card:redacted:')
		if (compressGameTraffic()) {
			data = lzutf8.compress(JSON.stringify(json), {
				outputEncoding: 'BinaryString',
			})
		}
		this.ws.send(data)
	}

	close(): void {
		this.ws.close()
	}

	static newInstance(ws: ws, game: ServerGame): PlayerWebSocket {
		return new PlayerWebSocket(ws, game)
	}
}
