import * as Assets from '../assets';

export default class World extends Phaser.State {
    private ship: Phaser.Sprite = null;
    private enemy: Phaser.Sprite = null;
    private bullet: Phaser.Weapon = null;
    private backgroundTemplateSprite: Phaser.TileSprite = null;
    private fireButton: Phaser.Key = null;

    private map: Phaser.Tilemap = null;
    private shallowLayer: Phaser.TilemapLayer = null;
    private objectLayer: Phaser.TilemapLayer = null;
    private waterLayer: Phaser.TilemapLayer = null;
    private layer: Phaser.TilemapLayer = null;

    private ROTATION_SPEED = 180;
    private ACCELERATION = 200;
    private MAX_SPEED = 250;
    private DRAG = 40;

    public preload(): void {
        this.game.load.tilemap('islands', Assets.JSON.Map.getJSON(), null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image('tiles', Assets.Images.Piratetiles.getPNG());
    }

    public create(): void {
        console.log(Assets);

        this.game.stage.backgroundColor = 0x3333f3;

        this.createBackground();
        this.createPlayer();

        this.map.setCollisionBetween(0, 999, true, this.layer);

        this.enemy = this.game.add.sprite(50, 50, Assets.Images.EnemyEnemyShip.getName());
        this.enemy.anchor.setTo(0.5, 0.5);

        this.game.input.keyboard.addKeyCapture([
           Phaser.Keyboard.LEFT,
           Phaser.Keyboard.RIGHT,
           Phaser.Keyboard.UP,
           Phaser.Keyboard.DOWN
        ]);
    }

    public update(): void {
        this.game.physics.arcade.collide(this.ship, this.layer);

        if (this.leftInput()) {
            this.ship.body.angularVelocity = -this.ROTATION_SPEED;
        } else if (this.rightInput()) {
            this.ship.body.angularVelocity = this.ROTATION_SPEED;
        } else {
            this.ship.body.angularVelocity = 0;
        }

        if (this.upInput()) {
            this.ship.body.acceleration.x = Math.cos(this.ship.rotation) * this.ACCELERATION;
            this.ship.body.acceleration.y = Math.sin(this.ship.rotation) * this.ACCELERATION;

            // show movement frame
        } else {
            this.ship.body.acceleration.setTo(0, 0);
            // reset frame etc
        }

        if (this.fireInput()) {
            this.fireWeapon();
            // this.bullet.fireMany(positions);
        }
    }

    private createBackground(): void {
        this.map = this.game.add.tilemap('islands');

        //  The first parameter is the tileset name, as specified in the Tiled map editor (and in the tilemap json file)
        //  The second parameter maps this name to the Phaser.Cache key 'tiles'
        this.map.addTilesetImage('piratetiles', 'tiles');

        //  Creates a layer from the World1 layer in the map data.
        //  A Layer is effectively like a Phaser.Sprite, so is added to the display list.
        this.waterLayer = this.map.createLayer('water');
        this.shallowLayer = this.map.createLayer('shallow water');
        this.layer = this.map.createLayer('islands');
        this.objectLayer = this.map.createLayer('objects');

        //  This resizes the game world to match the layer dimensions
        this.layer.resizeWorld();
    }

    private createPlayer(): void {
        this.ship = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Images.PlayerShip.getName());
        this.ship.anchor.setTo(0.5, 0.5);
        // this.ship.angle = -0;
        this.game.physics.enable(this.ship, Phaser.Physics.ARCADE);
        this.ship.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED);
        this.ship.body.drag.setTo(this.DRAG, this.DRAG);

        // keep on screen
        this.ship.body.collideWorldBounds = true;
        this.ship.body.bounce.set(0.5);

        this.game.camera.follow(this.ship);

        this.bullet = this.game.add.weapon(1, Assets.Images.CannonBall.getName());
        // KILL_DISTANCE or KILL_LIFESPAN
        this.bullet.bulletKillType = Phaser.Weapon.KILL_CAMERA_BOUNDS;
        this.bullet.bulletSpeed = 400;
        // target, x, y, rotation
        // rotation set in fire method
        this.bullet.trackSprite(this.ship, 14, 0);
    }

    private fireWeapon(): void {
        this.bullet.fireAngle = this.ship.body.rotation - 90;
        this.bullet.fire();
    }

    private fireInput(): boolean {
        return this.input.keyboard.isDown(Phaser.Keyboard.Q);
    }

    private upInput(): boolean {
        return this.input.keyboard.isDown(Phaser.Keyboard.UP);
    }

    private downInput(): boolean {
        return this.input.keyboard.isDown(Phaser.Keyboard.DOWN);
    }

    private leftInput(): boolean {
        return this.input.keyboard.isDown(Phaser.Keyboard.LEFT);
    }

    private rightInput(): boolean {
        return this.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
    }
}