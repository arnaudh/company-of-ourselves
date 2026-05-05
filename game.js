const GAME_WIDTH = 1000;
const GAME_HEIGHT = 640;

const ARENA = {
  x: 100,
  y: 330,
  width: 800,
  height: 150,
};

class MainScene extends Phaser.Scene {
  constructor() {
    super("main-scene");
    this.player = null;
    this.cursors = null;
    this.speed = 170;
    this.jumpSpeed = 430;
    this.ground = null;
    this.musicQueue = ["sad", "sad", "sad", "light", "light", "light"];
    this.musicIndex = 0;
    this.currentMusic = null;
    this.musicStarted = false;
  }

  preload() {
    this.load.image("wall", "assets/images/background_wall.jpg");
    this.load.image("sky", "assets/images/background_sky.jpg");
    this.load.image("man", "assets/images/man.png");
    this.load.audio("sad", "assets/audio/sad.mp3");
    this.load.audio("light", "assets/audio/light.mp3");
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "wall").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add
      .text(
        GAME_WIDTH / 2,
        80,
        "My attention is stolen by a green square\non the other end of the room. I want to\nbe its friend more than anything that I've\never wanted. I decide to use the Arrow\nKeys to approach it.",
        {
          fontFamily: "Georgia, Times New Roman, serif",
          fontStyle: "italic",
          fontSize: "52px",
          color: "#ffffff",
          align: "center",
          lineSpacing: 10,
          stroke: "#6a5637",
          strokeThickness: 8,
        },
      )
      .setOrigin(0.5, 0)
      .setScale(0.5);

    this.add.image(ARENA.x + ARENA.width / 2, ARENA.y + ARENA.height / 2, "sky").setDisplaySize(ARENA.width, ARENA.height);

    this.add.rectangle(ARENA.x + ARENA.width / 2, ARENA.y + ARENA.height - 2, ARENA.width, 4, 0x3cae3f);
    this.add.rectangle(ARENA.x + ARENA.width / 2, ARENA.y + ARENA.height - 6, ARENA.width, 2, 0x2f8f34, 0.5);

    this.drawLeftFlower();
    this.add.rectangle(ARENA.x + ARENA.width - 16, ARENA.y + ARENA.height - 18, 26, 26, 0x48d128).setOrigin(0.5, 0.5);

    this.ground = this.add.rectangle(ARENA.x + ARENA.width / 2, ARENA.y + ARENA.height - 3, ARENA.width, 6, 0x000000, 0);
    this.physics.add.existing(this.ground, true);

    this.player = this.physics.add.sprite(ARENA.x + 95, ARENA.y + ARENA.height - 22, "man").setScale(0.7);
    this.player.setDepth(5);
    this.player.body.setAllowGravity(true);
    this.player.body.setCollideWorldBounds(false);
    this.player.body.setSize(this.player.width * 0.55, this.player.height * 0.82);
    this.player.body.setOffset(this.player.width * 0.2, this.player.height * 0.18);
    this.player.body.setGravityY(950);

    this.physics.add.collider(this.player, this.ground);

    this.cursors = this.input.keyboard.createCursorKeys();

    // Some browsers block autoplay until first user interaction.
    if (this.sound.locked) {
      this.input.once("pointerdown", () => this.startMusicLoop());
      this.input.keyboard.once("keydown", () => this.startMusicLoop());
    } else {
      this.startMusicLoop();
    }

    this.events.on("shutdown", this.stopMusicLoop, this);
    this.events.on("destroy", this.stopMusicLoop, this);
  }

  drawLeftFlower() {
    const x = ARENA.x + 18;
    const y = ARENA.y + ARENA.height - 18;

    const flower = this.add.graphics();
    flower.fillStyle(0x3cae3f, 1);
    flower.fillRect(x - 1, y - 20, 2, 20);
    flower.fillStyle(0xffe76b, 1);
    flower.fillCircle(x, y - 20, 4);
    flower.fillStyle(0xffffff, 1);
    flower.fillCircle(x - 4, y - 22, 3);
    flower.fillCircle(x + 4, y - 22, 3);
    flower.fillCircle(x - 4, y - 18, 3);
    flower.fillCircle(x + 4, y - 18, 3);
  }

  update() {
    const body = this.player.body;
    body.setVelocityX(0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-this.speed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(this.speed);
      this.player.setFlipX(false);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && body.blocked.down) {
      body.setVelocityY(-this.jumpSpeed);
    }

    const halfW = body.width / 2;

    this.player.x = Phaser.Math.Clamp(this.player.x, ARENA.x + halfW, ARENA.x + ARENA.width - halfW);
  }

  startMusicLoop() {
    if (this.musicStarted) return;
    this.musicStarted = true;
    this.playNextTrack();
  }

  playNextTrack() {
    const trackKey = this.musicQueue[this.musicIndex];
    this.currentMusic = this.sound.add(trackKey, { volume: 0.35, loop: false });

    this.currentMusic.once("complete", () => {
      this.currentMusic.destroy();
      this.currentMusic = null;
      this.musicIndex = (this.musicIndex + 1) % this.musicQueue.length;
      this.playNextTrack();
    });

    this.currentMusic.play();
  }

  stopMusicLoop() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }
    this.musicStarted = false;
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: MainScene,
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
