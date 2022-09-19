import Barrel from './barrel'

export default class Explosion extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, scale = 1) {
        super(scene.matter.world, x, y, 'sprites', 'explosion1.png', {
            isSensor: true,
            isStatic: true,
            shape: {
                type: 'circle',
            },
        })
        this.setScale(scale)
        this.setOnCollide((data) => {
            let explosionForce = 10 * scale
            if (data.bodyA.gameObject)
                data.bodyA.gameObject.setVelocity(
                    data.bodyA.velocity.x + explosionForce * (data.bodyA.position.x - this.x) / this.width,
                    data.bodyA.velocity.y + explosionForce * (data.bodyA.position.y - this.y) / this.height,
                )
            if (data.bodyA.gameObject instanceof Barrel) {
                data.bodyA.gameObject.damage()
            }
        })
        const crater = this.scene.add.sprite(this.x, this.y, 'crater')
        crater.setAlpha(0.15)
        crater.setScale(scale)
        crater.setAngle(Phaser.Math.RND.angle())
        this.scene.tracksRenderTexture.draw(
            crater,
            this.x / this.scene.tracksRenderTexture.scale,
            this.y / this.scene.tracksRenderTexture.scale,
        )
        crater.destroy()
        this.anims.play('explosion')
        this.once('animationcomplete', () => {
            this.destroy()
        })
    }
}