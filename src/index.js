import Phaser from 'phaser'
import WebpackLoader from 'phaser-webpack-loader'
import AssetManifest from './assetManifest'
import Maze from './objects/maze'
import Tank from './objects/tank'
import Barrel from './objects/barrel'
import Crate from './objects/crate'
import Raycaster from "phaser3-rex-plugins/plugins/math/raycaster/Raycaster"

class TankGame extends Phaser.Scene {
    constructor(config) {
        super(config)
    }

    preload() {
        this.load.scenePlugin('WebpackLoader', WebpackLoader, 'loader', 'loader')
    }

    create() {
        this.loader.start(AssetManifest)
        this.loader.load().then((config, addToScene) => {
            this.sound.unlock()

            this.anims.create({
                key: 'explosion',
                frames: this.anims.generateFrameNames('atlas', {
                    prefix: 'explosion',
                    start: 1,
                    end: 5,
                }),
                frameRate: 24,
                repeat: 0,
            })

            const tileSize = {
                x: 200,
                y: 200,
            }
            const mazeSize = {
                x: Phaser.Math.RND.between(5, 12),
                y: Phaser.Math.RND.between(3, 9),
            }

            this.fitCameraToRect({
                    x: 0,
                    y: 0,
                    width: tileSize.x * mazeSize.x,
                    height: tileSize.y * mazeSize.y,
                },
                200,
            )

            let tracksResolutionDivider = 0.75 / this.cameras.main.zoom
            this.floorRenderTexture = this.add.renderTexture(0, 0, mazeSize.x * tileSize.x / tracksResolutionDivider, mazeSize.y * tileSize.y / tracksResolutionDivider)
            this.floorRenderTexture.setScale(tracksResolutionDivider)
            this.floorRenderTexture.fill(0x9393bf, 1)

            this.maze = new Maze(this, mazeSize.x, mazeSize.y, tileSize.x, tileSize.y)
            this.add.existing(this.maze)

            this.tanks = []
            const spawnTank = (color = 'blue', inputKeys) => {
                const tankSpawn = {
                    x: Phaser.Math.RND.between(0, mazeSize.x - 1) * tileSize.x + tileSize.x * 0.5,
                    y: Phaser.Math.RND.between(0, mazeSize.y - 1) * tileSize.y + tileSize.y * 0.5,
                }

                const tank = new Tank(this, tankSpawn.x, tankSpawn.y, color, inputKeys)
                tank.setAngle(Phaser.Math.RND.angle())
                this.add.existing(tank)
                this.tanks.push(tank)
            }

            this.barrels = []
            const spawnBarrel = () => {
                const barrelSpawn = {
                    x: Phaser.Math.RND.between(0, mazeSize.x - 1) * tileSize.x + tileSize.x * 0.5
                        + Phaser.Math.RND.between(-tileSize.x * 0.33, tileSize.x * 0.33),
                    y: Phaser.Math.RND.between(0, mazeSize.y - 1) * tileSize.y + tileSize.y * 0.5
                        + Phaser.Math.RND.between(-tileSize.y * 0.33, tileSize.y * 0.33),
                }

                const barrel = new Barrel(this, barrelSpawn.x, barrelSpawn.y)
                barrel.setAngle(Phaser.Math.RND.angle())
                this.add.existing(barrel)
                this.barrels.push(barrel)
            }

            this.crates = []
            const spawnCrate = () => {
                const crateSpawn = {
                    x: Phaser.Math.RND.between(0, mazeSize.x - 1) * tileSize.x + tileSize.x * 0.5,
                    y: Phaser.Math.RND.between(0, mazeSize.y - 1) * tileSize.y + tileSize.y * 0.5,
                }

                const crate = new Crate(this, crateSpawn.x, crateSpawn.y)
                this.add.existing(crate)
                this.crates.push(crate)
            }

            // spawnTank('red', {
            //     up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            //     left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            //     down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            //     right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            //     fire: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            // })
            spawnTank('blue', {
                up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
                left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
                down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
                right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
                fire: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            })

            for (let i = 0; i < Math.pow(mazeSize.x * mazeSize.y, 0.5) + Phaser.Math.RND.between(-2, 3); i++) {
                spawnBarrel()
            }

            for (let i = 0; i < Math.pow(mazeSize.x * mazeSize.y, 0.2); i++) {
                spawnCrate()
            }

            this.raycaster = new Raycaster()
            this.maze.walls.forEach(wall => {
                this.raycaster.addObstacle(wall)
            })
            this.maze.pillars.forEach(pillar => {
                this.raycaster.addObstacle(pillar)
            })
            this.tanks.forEach(tank => {
                this.raycaster.addObstacle(tank)
            })
            this.barrels.forEach(barrel => {
                this.raycaster.addObstacle(barrel)
            })
            this.crates.forEach(crate => {
                this.raycaster.addObstacle(crate)
            })

            const floorDecal = this.add.rectangle(0, 0, 20, 20, 0x000000, 0.1)
            for (let i = 0; i < mazeSize.x * mazeSize.y * 3; i++) {
                floorDecal.setPosition(Phaser.Math.RND.realInRange(0, mazeSize.x * tileSize.x), Phaser.Math.RND.realInRange(0, mazeSize.y * tileSize.y))
                floorDecal.setAngle(Phaser.Math.RND.angle())
                floorDecal.setScale(Phaser.Math.RND.between(1, 5))
                floorDecal.setAlpha(Phaser.Math.RND.realInRange(0, 0.5))
                this.floorRenderTexture.draw(floorDecal)
            }
            floorDecal.destroy()

            this.explosionParticles = this.add.particles('atlas', 'oilSpill_small')
            this.laserParticles = this.add.particles('star')

            this.input.keyboard.addKey('r').on('down', () => {
                this.input.keyboard.removeAllKeys()
                this.sound.stopAll()
                this.tweens.killAll()
                this.raycaster.clearObstacle()
                this.scene.restart()
            })

            this.debug = this.add.text(-22, -90, '', {font: '64px Roboto', fill: '#2f2c23'})

            this.scale.on('resize', (gameSize, baseSize, displaySize, resolution) => {
                this.fitCameraToRect({
                        x: 0,
                        y: 0,
                        width: tileSize.x * mazeSize.x,
                        height: tileSize.y * mazeSize.y,
                    },
                    200,
                    500,
                )
            })
            this.loaded = true
        })
    }

    update(time, delta) {
        if (this.loaded) {
            this.debug.setText([
                'FPS: ' + this.game.loop.actualFps.toFixed(2),
            ])
            this.tanks.forEach(tank => {
                this.raycaster.updateObstacle(tank)
            })
            this.barrels.forEach(barrel => {
                this.raycaster.updateObstacle(barrel)
            })
            this.crates.forEach(crate => {
                this.raycaster.updateObstacle(crate)
            })
        }
    }

    fitCameraToRect(rect, margin = 0, duration = 0) {
        if (duration > 0)
            this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: duration,
                onUpdate: (tween) => {
                    const targetZoom = Math.min((this.cameras.main.width - margin) / rect.width, (this.cameras.main.height - margin) / rect.height)
                    const zoom = this.cameras.main.zoom + (targetZoom - this.cameras.main.zoom) * tween.getValue()
                    this.cameras.main.setZoom(zoom)
                },
            })
        else {
            this.cameras.main.setZoom(Math.min((this.cameras.main.width - margin) / rect.width, (this.cameras.main.height - margin) / rect.height))
        }
        this.cameras.main.centerOn(rect.x + rect.width * 0.5, rect.y + rect.height * 0.5)
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'matter',
        matter: {
            runner: {
                isFixed: true,
                delta: 8,
            },
            gravity: {y: 0},
            // debug: {
            //     showBody: true,
            //     showStaticBody: true,
            //     showVelocity: true,
            //     showCollisions: true,
            //     showAxes: true,
            //     showPositions: true,
            //     showAngleIndicator: true,
            // },
        },
    },
    parent: 'tank-game',
    scene: TankGame,
    scale: {
        mode: Phaser.Scale.RESIZE,
        width: '100%',
        height: '100%',
    },
    backgroundColor: '#9393bf',
}

const game = new Phaser.Game(config)