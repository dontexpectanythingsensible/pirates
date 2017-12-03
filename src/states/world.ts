import * as Assets from '../assets';

class Enemy extends Phaser.Sprite {
    private explosions: Phaser.Group = null;

    constructor(game: Phaser.Game, x: number, y: number, sprite) {
        super(game, x, y, sprite);

        this.explosions = game.add.group();
        this.explosions.createMultiple(5, Assets.Images.EffectsExplosion1.getName());
        // this.game = game;
    }

    public health: number = 4;

    public takeDamage(damage: number): void {
        console.log('ouch');

        this.health -= damage;
        switch (this.health) {
            case 3:
                this.loadTexture(Assets.Images.EnemyEnemyShipDamage1.getName());
                break;
            case 2:
                this.loadTexture(Assets.Images.EnemyEnemyShipDamage2.getName());
                break;
            case 1:
                this.loadTexture(Assets.Images.EnemyEnemyShipDestroyed.getName());
                break;
        }

        const explosion = this.explosions.getFirstExists(false);
        if (!explosion) {
            return;
        }
        explosion.reset(this.body.x, this.body.y);
        setTimeout(() => explosion.kill(), 200);
    }
}

export default class World extends Phaser.State {
    private ship: Phaser.Sprite = null;
    private bullet: Phaser.Weapon = null;
    private backgroundTemplateSprite: Phaser.TileSprite = null;
    private fireButton: Phaser.Key = null;

    private map: Phaser.Tilemap = null;
    private shallowLayer: Phaser.TilemapLayer = null;
    private objectLayer: Phaser.TilemapLayer = null;
    private waterLayer: Phaser.TilemapLayer = null;
    private layer: Phaser.TilemapLayer = null;

    private dinghies: Phaser.Group = null;
    private treasure: Phaser.Group = null;
    private enemies: Phaser.Group = null;

    private ROTATION_SPEED = 180;
    private ACCELERATION = 200;
    private MAX_SPEED = 250;
    private DRAG = 80;

    private crew: number = 1;
    private crewLabel: Phaser.Text = null;
    private crewLabelBg: Phaser.Text = null;

    private treasureCount: number = 0;
    private treasureLabel: Phaser.Text = null;
    private treasureLabelBg: Phaser.Text = null;

    public preload(): void {
        this.game.load.tilemap('islands', Assets.JSON.Map.getJSON(), null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image('tiles', Assets.Images.Piratetiles.getPNG());
    }

    public create(): void {
        console.log(Assets);

        this.game.stage.backgroundColor = 0x3333f3;

        this.createBackground();
        this.createPlayer();
        this.createUi();

        this.dinghies = this.game.add.group();
        const dinghy = this.game.add.sprite(this.game.world.centerX - 64, this.game.world.centerY + 64, Assets.Images.DinghyDinghySmall.getName());
        this.game.physics.enable(dinghy, Phaser.Physics.ARCADE);
        this.dinghies.add(dinghy);

        this.treasure = this.game.add.group();
        const crate = this.game.add.sprite(this.game.world.centerX + 64, this.game.world.centerY - 64, Assets.Images.TreasureChest.getName());
        this.game.physics.enable(crate, Phaser.Physics.ARCADE);
        this.treasure.add(crate);

        this.map.setCollisionBetween(0, 999, true, this.layer);

        this.enemies = this.game.add.group();
        const enemy = new Enemy(this.game, this.game.world.centerX - 64, this.game.world.centerY - 64, Assets.Images.EnemyEnemyShip.getName());
        enemy.anchor.setTo(0.5, 0.5);
        this.game.physics.enable(enemy, Phaser.Physics.ARCADE);
        enemy.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED);
        enemy.body.drag.setTo(this.DRAG, this.DRAG);
        enemy.body.collideWorldBounds = true;
        enemy.body.bounce.set(0.5);
        this.enemies.add(enemy);

        this.game.input.keyboard.addKeyCapture([
           Phaser.Keyboard.LEFT,
           Phaser.Keyboard.RIGHT,
           Phaser.Keyboard.UP,
           Phaser.Keyboard.DOWN
        ]);
    }

    public update(): void {
        this.game.physics.arcade.collide(this.ship, this.layer);
        this.game.physics.arcade.collide(this.ship, this.dinghies, this.collectCrew, null, this);
        this.game.physics.arcade.collide(this.ship, this.treasure, this.collectTreasure, null, this);
        this.game.physics.arcade.collide(this.ship, this.enemies, this.crash, null, this);
        this.game.physics.arcade.overlap(this.bullet.bullets, this.enemies, this.strike, null, this);

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

    private collectCrew(ship, dinghy): void {
        this.crew += 1;
        this.updateCrew();
        dinghy.kill();
    }

    private collectTreasure(ship, treasure): void {
        treasure.kill();
        this.treasureCount += 10;
        this.updateTreasure();
    }

    private crash(ship, enemy): void {

    }

    private strike(bullet: Phaser.Group, enemy: Enemy): void {
        enemy.body.velocity.y = 0;
        enemy.takeDamage(1);
        bullet.kill();
    }

    private createUi(): void {
        this.crewLabelBg = this.game.add.text(
            75,
            75,
            `Crew: ${ this.crew }`,
            {
                font: '40px Boogaloo',
                fill: '#00b5bf'
            });
        this.crewLabelBg.alpha = 0;
        this.crewLabelBg.anchor.setTo(0.5, 0.5);
        this.crewLabelBg.fixedToCamera = true;

        this.crewLabel = this.game.add.text(
            75,
            75,
            `Crew: ${ this.crew }`,
            {
                font: '40px Boogaloo',
                fill: '#00b5bf'
            });
        this.crewLabel.anchor.setTo(0.5, 0.5);
        this.crewLabel.fixedToCamera = true;

        this.treasureLabelBg = this.game.add.text(
            725,
            75,
            `Booty: ${ this.treasureCount }`,
            {
                font: '40px Boogaloo',
                fill: '#00b5bf'
            });
        this.treasureLabelBg.alpha = 0;
        this.treasureLabelBg.anchor.setTo(0.5, 0.5);
        this.treasureLabelBg.fixedToCamera = true;

        this.treasureLabel = this.game.add.text(
            725,
            75,
            `Booty: ${ this.treasureCount }`,
            {
                font: '40px Boogaloo',
                fill: '#00b5bf'
            });
        this.treasureLabel.anchor.setTo(0.5, 0.5);
        this.treasureLabel.fixedToCamera = true;
    }

    updateCrew(): void {
        this.crewLabel.setText(`Crew: ${ this.crew }`);
        this.crewLabelBg.setText(`Crew: ${ this.crew }`);
        this.crewLabelBg.alpha = 1;
        this.game.add.tween(this.crewLabelBg).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None, true);
        this.crewLabelBg.scale.x = 1;
        this.crewLabelBg.scale.y = 1;
        this.game.add.tween(this.crewLabelBg.scale).to({ x: 2.5, y: 2}, 300, Phaser.Easing.Linear.None, true);
    }

    updateTreasure(): void {
        this.treasureLabel.setText(`Booty: ${ this.treasureCount }`);
        this.treasureLabelBg.setText(`Booty: ${ this.treasureCount }`);
        this.treasureLabelBg.alpha = 1;
        this.game.add.tween(this.treasureLabelBg).to({ alpha: 0 }, 300, Phaser.Easing.Linear.None, true);
        this.treasureLabelBg.scale.x = 1;
        this.treasureLabelBg.scale.y = 1;
        this.game.add.tween(this.treasureLabelBg.scale).to({ x: 2.5, y: 2}, 300, Phaser.Easing.Linear.None, true);
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
        this.bullet.fireRate = 600;
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