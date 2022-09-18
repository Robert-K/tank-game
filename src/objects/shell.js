import Phaser from 'phaser'
import {Pillar, Wall} from './maze'

export default class Shell extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, angle) {
        super(scene.matter.world, x, y, 'sprites', 'bulletDark1_outline.png', {
            angle: Phaser.Math.DegToRad(angle),
            frictionAir: 0,
            friction: 0,
            mass: 5,
            isSensor: true,
        })
        this.lastCollision = 0
        this.thrustLeft(0.1)
        this.setOnCollide((data) => {
                if (data.timeCreated - this.lastCollision > 1
                    && (data.bodyA.gameObject instanceof Pillar || data.bodyA.gameObject instanceof Wall)) {
                    const normal = new Phaser.Math.Vector2(data.collision.normal)
                    const velocity = new Phaser.Math.Vector2(this.body.velocity)
                    const dot = normal.dot(velocity)
                    const reflected = velocity.subtract(normal.scale(2 * dot))
                    this.setVelocity(reflected.x, reflected.y)
                    this.setAngularVelocity(0)
                    this.setAngle(Phaser.Math.RadToDeg(Math.atan2(this.body.velocity.y, this.body.velocity.x)) + 90)
                }
                this.lastCollision = data.timeCreated
            },
        )
    }
}