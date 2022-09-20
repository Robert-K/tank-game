import Tank from './tank'

export default class Crate extends Phaser.Physics.Matter.Image {
    constructor(scene, x, y) {
        super(scene.matter.world, x, y, 'sprites', 'crateWood_side.png', {
            mass: 3,
            frictionAir: 0.05,
        })
        this.collected = false
        this.setFixedRotation()
        this.setOnCollide((data) => {
            if (data.bodyA.gameObject instanceof Tank) {
                if (!this.collected) {
                    this.collected = true
                    this.setCollisionCategory(null)
                    const tank = data.bodyA.gameObject
                    scene.tweens.addCounter({
                        targets: this,
                        from: 0,
                        to: 1,
                        duration: 500,
                        onUpdate: (tween) => {
                            const target = new Phaser.Math.Vector2(this.body.position).lerp(tank.body.position, tween.getValue())
                            this.setPosition(target.x, target.y)
                            this.setScale(Math.pow(1 - tween.getValue(), 2))
                        },
                        onComplete: () => {
                            this.destroy()
                        },
                    })
                }
            }
        })
    }
}