import Shell from './shell'

export class TankBody extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, color = 'blue') {
        super(scene, x, y, 'sprites', `tankBody_${color}_outline.png`)
        this.setOrigin(0.5, 0.5)
    }
}

export class TankTurret extends Phaser.GameObjects.Container {
    constructor(scene, x, y, color = 'blue') {
        super(scene, x, y)
        this.barrel = scene.add.sprite(0, 0, 'sprites', `tank${color[0].toUpperCase() + color.substring(1)}_barrel2_outline.png`)
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
    constructor(scene, x, y, color = 'blue', inputKeys) {
        super(scene, x, y)

        this.trackFrame = 0

        this.tankBody = new TankBody(scene, 0, 0, color)
        this.add(this.tankBody)

        this.tankTurret = new TankTurret(scene, 0, 0, color)
        this.add(this.tankTurret)

        this.tracks = new Phaser.GameObjects.Sprite(scene, 0, 0, 'tracks')
        this.tracks.setVisible(false)
        this.tracks.alpha = 0.02
        this.tracks.setScale(1 / scene.floorRenderTexture.scale)
        this.add(this.tracks)

        this.setSize(this.tankBody.displayWidth - 10, this.tankBody.displayHeight - 12)

        this.inputKeys = inputKeys
        inputKeys.fire.on('down', (event) => {
            const fireOffset = new Phaser.Math.Vector2().setToPolar(this.rotation + this.tankTurret.rotation, this.tankTurret.barrel.height).rotate(Phaser.Math.PI2 / 4)
            let shell = new Shell(scene, this.x + fireOffset.x, this.y + fireOffset.y, this.angle + this.tankTurret.angle + 180)
            this.scene.add.existing(shell)
            this.tankTurret.fire()
            const knockback = {
                linear: 2,
                angular: 1.5,
            }
            this.thrustLeft(knockback.linear)
            this.body.torque = Phaser.Math.RND.realInRange(-knockback.angular, knockback.angular)
            scene.sound.play('shot')
        })

        this.motorPower = 0

        this.engineSound = scene.sound.add('engine', {
            loop: true,
            volume: 0.1,
        })
        this.engineSound.play()

        scene.matter.add.gameObject(this)
        this.body.frictionAir = 0.1
        this.body.mass = 100
        this.body.friction = 1
    }

    drawTracks() {
        this.tracks.angle = this.angle
        this.scene.floorRenderTexture.draw(
            this.tracks,
            this.x / this.scene.floorRenderTexture.scale,
            this.y / this.scene.floorRenderTexture.scale,
        )
    }

    preUpdate(time, delta) {
        let throttle = 0
        let throttleRate = 0.05
        if (this.inputKeys.up.isDown) {
            throttle += throttleRate
        }
        if (this.inputKeys.down.isDown) {
            throttle -= throttleRate
        }
        if (throttle !== 0)
            this.thrustRight(throttle * delta * 0.1)
        let turn = 0
        let turnRate = 0.1
        if (this.inputKeys.left.isDown) {
            turn -= turnRate
        }
        if (this.inputKeys.right.isDown) {
            turn += turnRate
        }
        if (turn !== 0)
            this.body.torque = turn * delta * 0.1

        this.motorPower = Phaser.Math.Linear(this.motorPower,
            (throttle !== 0 ? 0.7 : 0) + (turn !== 0 ? 0.3 : 0),
            delta * 0.003,
        )
        this.engineSound.volume = Phaser.Math.Linear(0.2, 1, this.motorPower)
        this.engineSound.detune = Phaser.Math.Linear(-500, 500, this.motorPower)
        this.engineSound.rate = Phaser.Math.Linear(0.7, 1, this.motorPower)

        if (this.trackFrame % 5 === 0 && (this.body.speed > 0.01 || this.body.angularSpeed > 0.001)) {
            this.drawTracks()
        }
        this.trackFrame++
    }
}