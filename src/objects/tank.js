import Shell from './shell'

export class TankBody extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'sprites', 'tankBody_blue_outline.png')
        this.setOrigin(0.5, 0.5)
    }
}

export class TankTurret extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y)
        this.barrel = scene.add.sprite(0, 0, 'sprites', 'tankBlue_barrel1_outline.png')
        this.barrel.setOrigin(0.5, 0)
        this.add(this.barrel)
    }

    fire() {
        let flash = new MuzzleFlash(this.scene, 0, this.barrel.height)
        this.add(flash)
        this.scene.tweens.add({
            targets: this,
            y: {from: -20, to: 0},
            ease: 'linear',
            duration: 700,
        })
    }
}

export class MuzzleFlash extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'sprites', 'shotLarge.png')
        this.setOrigin(0.5, 0)
        scene.time.addEvent({
            delay: 75,
            callback: () => this.destroy(),
        })
    }
}

export default class Tank extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y)

        this.tankBody = new TankBody(scene, 0, 0)
        this.add(this.tankBody)

        this.tankTurret = new TankTurret(scene, 0, 0)
        this.add(this.tankTurret)

        this.tracks = new Phaser.GameObjects.Sprite(scene, 0, 0, 'tracks')
        this.tracks.setVisible(false)
        this.tracks.alpha = 0.02
        this.add(this.tracks)

        this.setSize(this.tankBody.displayWidth - 10, this.tankBody.displayHeight - 12)

        this.movementKeys = scene.input.keyboard.createCursorKeys()
        let fireKey = scene.input.keyboard.addKey('space')
        fireKey.on('down', (event) => {
            const fireOffset = new Phaser.Math.Vector2().setToPolar(this.rotation + this.tankTurret.rotation, this.tankTurret.barrel.height).rotate(Phaser.Math.PI2 / 4)
            let shell = new Shell(scene, this.x + fireOffset.x, this.y + fireOffset.y, this.angle + this.tankTurret.angle + 180)
            this.scene.add.existing(shell)
            this.tankTurret.fire()
            this.thrustLeft(3)
        })

        scene.matter.add.gameObject(this)
        this.body.frictionAir = 0.1
        this.body.mass = 100
        this.body.friction = 1

        scene.add.existing(this)
    }

    preUpdate(time, delta) {
        let throttle = 0
        let throttleRate = 0.05
        if (this.movementKeys.up.isDown) {
            throttle += throttleRate
        }
        if (this.movementKeys.down.isDown) {
            throttle -= throttleRate
        }
        this.thrustRight(throttle)
        let turn = 0
        let turnRate = 0.1
        if (this.movementKeys.left.isDown) {
            turn -= turnRate
        }
        if (this.movementKeys.right.isDown) {
            turn += turnRate
        }
        this.body.torque = turn

        if (Math.abs(throttle) > 0.01 || Math.abs(turn) > 0.01) {
            this.tracks.angle = this.angle
            this.scene.tracksRenderTexture.draw(this.tracks, this.x, this.y)
        }
    }
}