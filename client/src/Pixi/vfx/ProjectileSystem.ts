import * as PIXI from 'pixi.js'
import Core from '@/Pixi/Core'
import RenderedProjectile from '@/Pixi/models/RenderedProjectile'
import TextureAtlas from '@/Pixi/render/TextureAtlas'
import { easeInOutQuad, easeInQuad } from 'js-easing-functions'
import RenderedCard from '@/Pixi/cards/RenderedCard'
import AudioEffectCategory from '@/Pixi/audio/AudioEffectCategory'
import AudioSystem from '@/Pixi/audio/AudioSystem'
import Utils, { getDistance } from '@/utils/Utils'
import RenderedVelocityProjectile from '@/Pixi/models/RenderedVelocityProjectile'
import { PI_2 } from 'pixi.js'

export default class ProjectileSystem {
	private projectiles: RenderedProjectile[] = []
	private velocityProjectiles: RenderedVelocityProjectile[] = []

	public tick(deltaTime: number, deltaFraction: number): void {
		// Eased projectiles
		const endOfLifeProjectiles = this.projectiles.filter((projectile) => projectile.currentTime >= projectile.lifetime)
		endOfLifeProjectiles.forEach((projectile) => {
			Core.renderer.rootContainer.removeChild(projectile.sprite)
			Core.renderer.rootContainer.removeChild(projectile.trail.rope)
		})

		this.projectiles = this.projectiles.filter((projectile) => projectile.currentTime < projectile.lifetime)

		this.projectiles.forEach((projectile) => {
			projectile.currentTime += deltaTime
			const targetPoint = projectile.targetCard
				? projectile.targetCard.getPosition()
				: projectile.targetMouse
				? Core.input.mousePosition.clone()
				: projectile.targetPoint.clone()

			const currentTime = Math.min(projectile.currentTime, projectile.animationDuration)
			const timePosition = currentTime / projectile.animationDuration
			const quadOffset = projectile.curve * (-4 * Math.pow(timePosition - 0.5, 2) + 1) * (350 + projectile.randomnessFactor * 50)

			if (projectile.startingPoint.x <= targetPoint.x) {
				targetPoint.x += quadOffset
			} else if (projectile.startingPoint.x > targetPoint.x) {
				targetPoint.x -= quadOffset
			}

			if (projectile.startingPoint.y < targetPoint.y) {
				targetPoint.y -= Math.cos((timePosition * Math.PI) / 2) * (300 + projectile.randomnessFactor * 500) * projectile.curve
			} else if (projectile.startingPoint.y >= targetPoint.y) {
				targetPoint.y += Math.cos((timePosition * Math.PI) / 2) * (300 + projectile.randomnessFactor * 500) * projectile.curve
			}

			const distanceVector = {
				x: targetPoint.x - projectile.startingPoint.x,
				y: targetPoint.y - projectile.startingPoint.y,
			}

			if (projectile.currentTime < projectile.animationDuration) {
				projectile.sprite.position.x = easeInQuad(currentTime, projectile.startingPoint.x, distanceVector.x, projectile.animationDuration)
				projectile.sprite.position.y = easeInQuad(currentTime, projectile.startingPoint.y, distanceVector.y, projectile.animationDuration)
			}

			projectile.trail.update(new PIXI.Point(projectile.sprite.position.x, projectile.sprite.position.y))
			if (projectile.currentTime >= projectile.animationDuration) {
				projectile.sprite.scale.set(Math.max(0, projectile.sprite.scale.x - 1.2 * deltaFraction))
				if (!projectile.impactPerformed) {
					projectile.impactPerformed = true
					projectile.sprite.position.x = targetPoint.x
					projectile.sprite.position.y = targetPoint.y
					projectile.onImpact()
				}
			}
		})

		// Velocity projectiles
		const endOfLifeVelocityProjectiles = this.velocityProjectiles.filter((projectile) => projectile.currentTime >= projectile.lifetime)
		endOfLifeVelocityProjectiles.forEach((projectile) => {
			Core.renderer.rootContainer.removeChild(projectile.sprite)
			Core.renderer.rootContainer.removeChild(projectile.trail.rope)
		})

		this.velocityProjectiles = this.velocityProjectiles.filter((projectile) => projectile.currentTime < projectile.lifetime)

		this.velocityProjectiles.forEach((projectile) => {
			projectile.currentTime += deltaTime

			const position = projectile.sprite.position
			const targetPosition = projectile.impactPerformed ? position : Core.input.mousePosition.clone()

			projectile.velocity = Math.max(0, projectile.velocity + projectile.acceleration * deltaFraction)
			if (getDistance(projectile.sprite.position, targetPosition) <= projectile.velocity * deltaFraction) {
				projectile.sprite.scale.set(Math.max(0, projectile.sprite.scale.x - 1.2 * deltaFraction))
				if (!projectile.impactPerformed) {
					projectile.impactPerformed = true
					projectile.onImpact()
					projectile.sprite.position.x = targetPosition.x
					projectile.sprite.position.y = targetPosition.y
				}
			} else {
				const angle = Utils.getVectorAngleAsRadians({
					x: targetPosition.x - position.x,
					y: targetPosition.y - position.y,
				})

				const newPosition = Utils.getPointWithOffset(position, angle, projectile.velocity * deltaFraction)
				projectile.sprite.position.copyFrom(newPosition)
			}
			projectile.trail.update(new PIXI.Point(projectile.sprite.position.x, projectile.sprite.position.y))
		})
	}

	private createAttackProjectile(sourcePosition: PIXI.Point, targetCard: RenderedCard, onImpact: () => void): RenderedProjectile {
		const sprite = new PIXI.Sprite(TextureAtlas.getTexture('effects/fireball-static'))
		sprite.zIndex = 100
		sprite.scale.set(0.4)
		sprite.anchor.set(0.5, 0.5)
		const projectile = RenderedProjectile.targetCard(sprite, sourcePosition, targetCard, 500, 1200)
		projectile.onImpact = onImpact
		projectile.trail.rope.zIndex = 99
		Core.renderer.rootContainer.addChild(projectile.sprite)
		Core.renderer.rootContainer.addChild(projectile.trail.rope)
		Core.mainHandler.projectileSystem.projectiles.push(projectile)
		AudioSystem.playEffect(AudioEffectCategory.PROJECTILE)
		return projectile
	}

	public createBoardBoopProjectile(
		sourcePoint: PIXI.Point,
		targetPoint: PIXI.Point,
		mouseEvent: MouseEvent,
		color: { start: string; end: string }
	): RenderedVelocityProjectile {
		const sprite = new PIXI.Sprite(TextureAtlas.getTexture('effects/fireball-static'))
		sprite.zIndex = 100
		sprite.scale.set(0.4)
		sprite.anchor.set(0.5, 0.5)
		const projectile = RenderedVelocityProjectile.targetMouse(sprite, sourcePoint, 3500, 3000, 10000)
		projectile.onImpact = () => {
			const angle = Utils.getVectorAngleAsDegrees({
				x: Core.input.mousePosition.x - projectile.sprite.position.x,
				y: Core.input.mousePosition.y - projectile.sprite.position.y,
			})
			Core.particleSystem.createBoardBoopEffect(Core.input.mousePosition, mouseEvent, angle, 1 + projectile.velocity / 5000, color)
		}
		projectile.trail.rope.zIndex = 99
		Core.renderer.rootContainer.addChild(projectile.sprite)
		Core.renderer.rootContainer.addChild(projectile.trail.rope)
		Core.mainHandler.projectileSystem.velocityProjectiles.push(projectile)
		// AudioSystem.playEffect(AudioEffectCategory.PROJECTILE)
		return projectile
	}

	public createCardAttackProjectile(sourceCard: RenderedCard, targetCard: RenderedCard): RenderedProjectile {
		return this.createAttackProjectile(sourceCard.getVisualPosition(), targetCard, () => {
			Core.particleSystem.createAttackImpactParticleEffect(targetCard)
			AudioSystem.playEffect(AudioEffectCategory.IMPACT_GENERIC)
		})
	}

	public createUniverseAttackProjectile(targetCard: RenderedCard): RenderedProjectile {
		return this.createAttackProjectile(new PIXI.Point(0, 0), targetCard, () => {
			Core.particleSystem.createAttackImpactParticleEffect(targetCard)
			AudioSystem.playEffect(AudioEffectCategory.IMPACT_GENERIC)
		})
	}

	public createCardAffectProjectile(sourceCard: RenderedCard, targetCard: RenderedCard): RenderedProjectile {
		return this.createAttackProjectile(sourceCard.getVisualPosition(), targetCard, () => {
			/* Empty */
		})
	}

	public createUniverseAffectProjectile(targetCard: RenderedCard): RenderedProjectile {
		return this.createAttackProjectile(new PIXI.Point(0, 0), targetCard, () => {
			/* Empty */
		})
	}

	public createCardHealProjectile(sourceCard: RenderedCard, targetCard: RenderedCard): RenderedProjectile {
		return this.createAttackProjectile(sourceCard.getVisualPosition(), targetCard, () => {
			Core.particleSystem.createHealImpactParticleEffect(targetCard)
			AudioSystem.playEffect(AudioEffectCategory.IMPACT_HEAL)
		})
	}

	public createUniverseHealProjectile(targetCard: RenderedCard): RenderedProjectile {
		return this.createAttackProjectile(new PIXI.Point(0, 0), targetCard, () => {
			Core.particleSystem.createHealImpactParticleEffect(targetCard)
			AudioSystem.playEffect(AudioEffectCategory.IMPACT_HEAL)
		})
	}
}
