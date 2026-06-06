const SOURCE_SCREENSHOT_WIDTH = 601;
const SOURCE_SCREENSHOT_HEIGHT = 399;
const GAME_SCALE_FACTOR = 1.3;

const BASE_GAME_WIDTH = Math.round(SOURCE_SCREENSHOT_WIDTH * GAME_SCALE_FACTOR);
const BASE_GAME_HEIGHT = Math.round(SOURCE_SCREENSHOT_HEIGHT * GAME_SCALE_FACTOR);

const BASE_PLAY_AREA_Y_RATIO = 0.515625;
const BASE_PLAY_AREA_HEIGHT_RATIO = 0.234375;
const BASE_PLAY_AREA_WIDTH = Math.round(BASE_GAME_WIDTH * 0.9);
const BASE_PLAY_AREA_HEIGHT = Math.round(BASE_GAME_HEIGHT * BASE_PLAY_AREA_HEIGHT_RATIO * 1.5);
const BASE_PLAY_AREA = {
  x: Math.round((BASE_GAME_WIDTH - BASE_PLAY_AREA_WIDTH) / 2),
  y: Math.round(BASE_GAME_HEIGHT * (BASE_PLAY_AREA_Y_RATIO + BASE_PLAY_AREA_HEIGHT_RATIO * 0.2)),
  width: BASE_PLAY_AREA_WIDTH,
  height: BASE_PLAY_AREA_HEIGHT,
};

const WORLD_EXPAND_SIDES_RATIO = 0.3;
const SKY_ABOVE_CEILING_HEIGHT_RATIO = 0.35;
const SIDE_EXPANSION = Math.round(BASE_PLAY_AREA.width * WORLD_EXPAND_SIDES_RATIO);
const SKY_ABOVE_HEIGHT = Math.round(BASE_PLAY_AREA.y * SKY_ABOVE_CEILING_HEIGHT_RATIO);
const WORLD_OFFSET_X = SIDE_EXPANSION;
const WORLD_OFFSET_Y = SKY_ABOVE_HEIGHT;

const GAME_WIDTH = BASE_GAME_WIDTH + SIDE_EXPANSION * 2;
const GAME_HEIGHT = BASE_GAME_HEIGHT + SKY_ABOVE_HEIGHT;

const BASE_FRAME = {
  x: WORLD_OFFSET_X,
  y: WORLD_OFFSET_Y,
  width: BASE_GAME_WIDTH,
  height: BASE_GAME_HEIGHT,
};

const PAGE_BG_COLOR = 0x3a2f1f;

const PLAY_AREA = {
  x: WORLD_OFFSET_X + BASE_PLAY_AREA.x,
  y: WORLD_OFFSET_Y + BASE_PLAY_AREA.y,
  width: BASE_PLAY_AREA.width,
  height: BASE_PLAY_AREA.height,
};

const EXPANDED_PLAY_AREA = {
  x: WORLD_OFFSET_X + BASE_PLAY_AREA.x - SIDE_EXPANSION,
  y: PLAY_AREA.y,
  width: BASE_PLAY_AREA.width + SIDE_EXPANSION * 2,
  height: PLAY_AREA.height,
};

const toLegacyCoords = (x, y) => ({
  x: x - WORLD_OFFSET_X,
  y: y - WORLD_OFFSET_Y,
});

const toWorldCoords = (x, y) => ({
  x: x + WORLD_OFFSET_X,
  y: y + WORLD_OFFSET_Y,
});

const GAME_ID = "company-of-ourselves";
const INITIAL_PLAYER = "pulsar";
const FLOWER_PROXIMITY_X = 16;
const FLOWER_PROXIMITY_Y = 22;
const SHADOW_MEET_DISTANCE = 42;
const SHADOW_JOKE_DISPLAY_MS = 10000;
const FLOWER_TEXT_SCALE = 0.5;
const FLOWER_TEXT_WRAP_VISUAL_WIDTH = Math.round(BASE_PLAY_AREA.width * 1.12);
const FLOWER_TEXT_COLOR = "#ffd36e";
const LEGACY_TEXT_X = WORLD_OFFSET_X + Math.round(BASE_GAME_WIDTH / 2);
const LEGACY_TEXT_Y = WORLD_OFFSET_Y + 80;
const TURN_4_FLOWER_LINES = [
  "when you are feeling low, there are usually two ways out",
  "either you dig into what's blocking you",
  "or a friend lifts your spirits",
  "sometimes you need both",
];
const SHADOW_JOKES_BY_RUN = {
  1: "a Freudian slip is when you say one thing and mean your mother",
  2: "What's the difference between a psychologist and a magician? A magician pulls rabbits out of hats, whereas a psychologist pulls habits out of rats.",
  3: 'Receptionist to psychologist: "Doctor, there\'s a patient here who thinks he\'s invisible." "Tell him I can\'t see him right now."',
};
const fetchNoStore = (resource, options = {}) => fetch(resource, { ...options, cache: "no-store" });
const CHARACTER_SCALE = 1.4;
const CHARACTER_BODY_WIDTH_RATIO = 0.55;
const CHARACTER_BODY_HEIGHT_RATIO = 0.82;
const CHARACTER_BODY_OFFSET_X_RATIO = 0.2;
const CHARACTER_BODY_OFFSET_Y_RATIO = 0.18;
const CHARACTER_STAND_PLATFORM_HEIGHT = 6;
const CHARACTER_STAND_PLATFORM_LANDING_MARGIN = 10;
const CEILING_DIG_RADIUS = 20;
const CEILING_TILE_SIZE = 16;
const CEILING_TOP_LANDING_TOLERANCE = 14;
const CEILING_FALL_LANDING_EXTRA = 10;
const CEILING_BACKING_COLOR = 0x1f1810;
const MAIN_GROUND_HEIGHT = 6;
const RAVINE_FLOOR_COLLIDER_HEIGHT = 24;
const CEILING_DIGGING_RUN_NUMBER = 4;
const TURN_END_SETTLE_TIMEOUT_MS = 8000;
const TURN_END_MIN_RECORD_MS = 500;
const TURN_END_SETTLED_FRAME_COUNT = 4;
const PLAYER_STOP_VELOCITY_THRESHOLD = 12;
const SKY_BACKGROUND_DEPTH = 0.5;
const GRASS_DEPTH = 3;

const CHARACTER_STYLES = {
  pulsar: {
    textureKey: "pulsar",
    shadowTint: 0x555555,
    shadowAlpha: 0.45,
    textColor: "#000000",
  },
  hiike: {
    textureKey: "hiike",
    shadowTint: 0xc8c8c8,
    shadowAlpha: 0.72,
    textColor: "#ffffff",
  },
};

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("preload-scene");
  }

  preload() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PAGE_BG_COLOR);

    const loadingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, "Loading...", {
        fontFamily: "Arial, sans-serif",
        fontSize: "30px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const progressText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, "0%", {
        fontFamily: "Arial, sans-serif",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const spinner = this.add.graphics();
    spinner.lineStyle(8, 0xffffff, 0.95);
    spinner.beginPath();
    spinner.arc(0, 0, 28, 0.25, Math.PI * 1.75, false);
    spinner.strokePath();
    spinner.setPosition(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    this.tweens.add({
      targets: spinner,
      angle: 360,
      duration: 900,
      repeat: -1,
      ease: "Linear",
    });

    this.load.on("progress", (value) => {
      progressText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on("complete", () => {
      this.time.delayedCall(120, () => this.scene.start("main-scene"));
    });

    this.load.image("wall", "assets/images/background_wall.jpg");
    this.load.image("sky", "assets/images/background_sky.jpg");
    this.load.image("pulsar", "assets/images/pulsar.png");
    this.load.image("hiike", "assets/images/hiike.png");
    this.load.audio("sad", "assets/audio/sad.mp3");
    this.load.audio("light", "assets/audio/light.mp3");
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("main-scene");
    this.player = null;
    this.cursors = null;
    this.storyText = null;
    this.storyHideTimer = null;
    this.storyTextSpeaker = null;
    this.flowerPosition = null;
    this.flowerLineIndex = 0;
    this.hasCompletedFlowerOnce = false;
    this.wasOnFlower = false;
    this.hasLeftFlowerSinceLastLine = true;
    this.shadowJokeLockUntil = 0;
    this.speed = 170;
    this.jumpSpeed = 430;
    this.ground = null;
    this.musicQueue = ["sad", "sad", "light", "light"];
    this.musicIndex = 0;
    this.currentMusic = null;
    this.musicStarted = false;
    this.recorder = null;
    this.captureDownloadKey = null;
    this.finishShadowsKey = null;
    this.captureDownloadInProgress = false;
    this.hasDownloadedCapture = false;
    this.actionHistory = [];
    this.recordingStartTime = 0;
    this.shadowReplays = [];
    this.playerTurn = INITIAL_PLAYER;
    this.loadedRunCountForGame = 0;
    this.loadedRunMaxNumberForGame = 0;
    this.movementLocked = false;
    this.hasTriggeredTurnEndSequence = false;
    this.awaitingCaptureAfterStop = false;
    this.turnEndRequestedAt = 0;
    this.turnEndSettledFrameCount = 0;
    this.flowerGraphics = null;
    this.characterStandPlatforms = null;
    this.playerStandPlatform = null;
    this.characterStandColliderAdded = false;
    this.ceilingRenderTexture = null;
    this.ceilingBacking = null;
    this.digBrush = null;
    this.ceilingSolidGrid = null;
    this.ceilingDigMarks = [];
    this.ceilingCols = 0;
    this.ceilingRows = 0;
    this.ceilingOriginY = 0;
    this.playerSupportedByCeiling = false;
    this.playerSupportedByRavineFloor = false;
    this.ceilingSupportSurfaceY = null;
    this.playArea = null;
    this.originalPlayArea = null;
    this.hasExpandedWorld = false;
    this.wallBackground = null;
    this.skyBackground = null;
    this.skyBackgroundMask = null;
    this.grassLines = [];
    this.leftRavineFloor = null;
    this.rightRavineFloor = null;
    this.leftRavineFloorCollider = null;
    this.rightRavineFloorCollider = null;
    this.ravineFloorCollidersAdded = false;
  }

  create() {
    this.playArea = { ...PLAY_AREA };
    this.originalPlayArea = { x: PLAY_AREA.x, width: PLAY_AREA.width };

    this.pageBackground = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, PAGE_BG_COLOR)
      .setDepth(-2);

    this.wallBackground = this.add
      .image(BASE_FRAME.x + BASE_FRAME.width / 2, BASE_FRAME.y + BASE_FRAME.height / 2, "wall")
      .setDisplaySize(BASE_FRAME.width, BASE_FRAME.height);

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.createDiggableCeiling();

    this.storyText = this.add
      .text(
        LEGACY_TEXT_X,
        LEGACY_TEXT_Y,
        "",
        {
          fontFamily: "Georgia, Times New Roman, serif",
          fontStyle: "italic",
          fontSize: "52px",
          color: FLOWER_TEXT_COLOR,
          align: "center",
          lineSpacing: 10,
          stroke: "#6a5637",
          strokeThickness: 8,
          wordWrap: {
            width: FLOWER_TEXT_WRAP_VISUAL_WIDTH / FLOWER_TEXT_SCALE,
            useAdvancedWrap: true,
          },
        },
      )
      .setOrigin(0.5, 0)
      .setScale(FLOWER_TEXT_SCALE)
      .setDepth(10);
    this.storyText.setVisible(false);

    this.syncSkyBackground();

    this.grassLines = [
      this.add
        .rectangle(
          this.playArea.x + this.playArea.width / 2,
          this.playArea.y + this.playArea.height - 2,
          this.playArea.width,
          4,
          0x3cae3f,
        )
        .setDepth(GRASS_DEPTH),
      this.add
        .rectangle(
          this.playArea.x + this.playArea.width / 2,
          this.playArea.y + this.playArea.height - 6,
          this.playArea.width,
          2,
          0x2f8f34,
          0.5,
        )
        .setDepth(GRASS_DEPTH),
    ];

    const flowerData = this.drawLeftFlower();
    this.flowerPosition = flowerData.position;
    this.flowerGraphics = flowerData.graphics;

    this.ground = this.add.rectangle(
      this.playArea.x + this.playArea.width / 2,
      this.playArea.y + this.playArea.height - MAIN_GROUND_HEIGHT / 2,
      this.playArea.width,
      MAIN_GROUND_HEIGHT,
      0x000000,
      0,
    );
    this.physics.add.existing(this.ground, true);
    this.ground.body.updateFromGameObject();
    this.characterStandPlatforms = this.physics.add.staticGroup();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.captureDownloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.finishShadowsKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.initRecording();
    this.events.on("preupdate", this.preUpdateCharacters, this);
    this.events.on("postupdate", this.resolvePlayerCeilingCollision, this);
    this.events.on("postupdate", this.tryCompleteTurnCapture, this);
    this.loadPastRunReplays().finally(() => {
      this.createPlayer();
      this.setupCharacterStandColliders();
      this.resetActionRecording();
    });

    // Some browsers block autoplay until first user interaction.
    if (this.sound.locked) {
      this.input.once("pointerdown", () => this.startMusicLoop());
      this.input.keyboard.once("keydown", () => this.startMusicLoop());
    } else {
      this.startMusicLoop();
    }

    this.events.on("shutdown", this.stopMusicLoop, this);
    this.events.on("destroy", this.stopMusicLoop, this);
    this.events.on("shutdown", this.cleanupRecording, this);
    this.events.on("destroy", this.cleanupRecording, this);
    this.events.on("shutdown", this.cleanupShadowReplays, this);
    this.events.on("destroy", this.cleanupShadowReplays, this);
    this.events.on("shutdown", this.cleanupCeiling, this);
    this.events.on("destroy", this.cleanupCeiling, this);

    if (typeof window.hideBootLoader === "function") {
      window.hideBootLoader();
    }
  }

  drawLeftFlower() {
    const x = this.playArea.x + 18;
    const y = this.playArea.y + this.playArea.height - 8;

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
    flower.setDepth(6);

    return { position: { x, y: y - 20 }, graphics: flower };
  }

  getSkyBackgroundBounds() {
    const pa = this.playArea;
    if (this.hasExpandedWorld) {
      return { x: pa.x, y: 0, width: pa.width, height: pa.y + pa.height };
    }
    return { x: pa.x, y: pa.y, width: pa.width, height: pa.height };
  }

  syncSkyBackground() {
    const bounds = this.getSkyBackgroundBounds();

    if (!this.skyBackground) {
      this.skyBackground = this.add.tileSprite(bounds.x, bounds.y, bounds.width, bounds.height, "sky");
      this.skyBackground.setOrigin(0, 0);
      this.skyBackground.setDepth(SKY_BACKGROUND_DEPTH);
    } else {
      this.skyBackground.setPosition(bounds.x, bounds.y);
      this.skyBackground.setSize(bounds.width, bounds.height);
    }

    if (this.hasExpandedWorld) {
      this.skyBackground.clearMask(true);
      this.skyBackgroundMask?.destroy();
      this.skyBackgroundMask = null;
      return;
    }

    if (this.skyBackgroundMask) return;

    const pa = this.playArea;
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillRect(pa.x, pa.y, pa.width, pa.height);
    this.skyBackgroundMask = maskShape.createGeometryMask();
    this.skyBackground.setMask(this.skyBackgroundMask);
  }

  createWallFill(x, y, width, height, depth = 1) {
    const wall = this.add.image(x + width / 2, y + height / 2, "wall");
    wall.setDisplaySize(width, height);
    wall.setDepth(depth);
    return wall;
  }

  getCeilingOriginY() {
    return this.ceilingOriginY || 0;
  }

  getCeilingX() {
    return this.playArea.x;
  }

  getCeilingWidth() {
    return this.playArea.width;
  }

  getCeilingHeight() {
    return this.playArea.y - this.getCeilingOriginY();
  }

  createDiggableCeiling() {
    this.ceilingOriginY = WORLD_OFFSET_Y;

    const ceilingX = this.getCeilingX();
    const ceilingY = this.getCeilingOriginY();
    const ceilingWidth = this.getCeilingWidth();
    const ceilingHeight = this.getCeilingHeight();

    this.ceilingBacking = this.add
      .rectangle(ceilingX + ceilingWidth / 2, ceilingY + ceilingHeight / 2, ceilingWidth, ceilingHeight, CEILING_BACKING_COLOR)
      .setDepth(1);

    this.ceilingRenderTexture = this.add
      .renderTexture(ceilingX, ceilingY, ceilingWidth, ceilingHeight)
      .setOrigin(0, 0)
      .setDepth(2);

    this.stampWallOntoCeilingRenderTexture();

    this.digBrush = this.make.graphics({ x: 0, y: 0, add: false });
    this.digBrush.fillStyle(0xffffff, 1);
    this.digBrush.fillCircle(0, 0, CEILING_DIG_RADIUS);

    this.ceilingCols = Math.ceil(ceilingWidth / CEILING_TILE_SIZE);
    this.ceilingRows = Math.ceil((this.playArea.y - this.getCeilingOriginY()) / CEILING_TILE_SIZE);
    this.ceilingSolidGrid = Array.from({ length: this.ceilingRows }, () =>
      Array.from({ length: this.ceilingCols }, () => true),
    );
  }

  stampWallOntoCeilingRenderTexture() {
    if (!this.ceilingRenderTexture) return;

    const ceilingX = this.getCeilingX();
    const ceilingY = this.getCeilingOriginY();
    const wallStamp = this.make.image({
      key: "wall",
      x: BASE_FRAME.x + BASE_FRAME.width / 2 - ceilingX,
      y: BASE_FRAME.y + BASE_FRAME.height / 2 - ceilingY,
      add: false,
    });
    wallStamp.setDisplaySize(BASE_FRAME.width, BASE_FRAME.height);
    this.ceilingRenderTexture.draw(wallStamp);
    wallStamp.destroy();
  }

  eraseCeilingVisualAt(worldX, worldY) {
    if (!this.ceilingRenderTexture || !this.digBrush) return;
    const localX = worldX - this.getCeilingX();
    const localY = worldY - this.getCeilingOriginY();
    this.ceilingRenderTexture.erase(this.digBrush, localX, localY);
  }

  recordCeilingDigMark(worldX, worldY) {
    const mergeDistance = CEILING_DIG_RADIUS * 0.4;
    for (const mark of this.ceilingDigMarks) {
      if (Phaser.Math.Distance.Between(mark.x, mark.y, worldX, worldY) < mergeDistance) {
        return;
      }
    }
    this.ceilingDigMarks.push({ x: worldX, y: worldY });
  }

  reapplyCeilingDigMarks() {
    if (!this.ceilingRenderTexture || !this.digBrush) return;

    if (this.ceilingDigMarks.length > 0) {
      for (const mark of this.ceilingDigMarks) {
        this.eraseCeilingVisualAt(mark.x, mark.y);
      }
      return;
    }

    this.reapplyCeilingDigsFromGrid();
  }

  reapplyCeilingDigsFromGrid() {
    if (!this.ceilingSolidGrid) return;

    for (let row = 0; row < this.ceilingRows; row += 1) {
      for (let col = 0; col < this.ceilingCols; col += 1) {
        if (this.ceilingSolidGrid[row][col]) continue;
        const worldX = this.getCeilingX() + col * CEILING_TILE_SIZE + CEILING_TILE_SIZE / 2;
        const worldY = this.getCeilingOriginY() + row * CEILING_TILE_SIZE + CEILING_TILE_SIZE / 2;
        this.eraseCeilingVisualAt(worldX, worldY);
      }
    }
  }

  rebuildCeilingVisuals(useSkyBacking) {
    const ceilingX = this.getCeilingX();
    const ceilingY = this.getCeilingOriginY();
    const ceilingWidth = this.getCeilingWidth();
    const ceilingHeight = this.getCeilingHeight();

    this.ceilingBacking?.destroy();
    this.ceilingRenderTexture?.destroy();

    if (useSkyBacking) {
      this.ceilingBacking = this.add
        .rectangle(ceilingX + ceilingWidth / 2, ceilingY + ceilingHeight / 2, ceilingWidth, ceilingHeight, 0x000000, 0)
        .setDepth(1);
    } else {
      this.ceilingBacking = this.add
        .rectangle(ceilingX + ceilingWidth / 2, ceilingY + ceilingHeight / 2, ceilingWidth, ceilingHeight, CEILING_BACKING_COLOR)
        .setDepth(1);
    }

    this.ceilingRenderTexture = this.add
      .renderTexture(ceilingX, ceilingY, ceilingWidth, ceilingHeight)
      .setOrigin(0, 0)
      .setDepth(2);

    this.stampWallOntoCeilingRenderTexture();
    this.reapplyCeilingDigMarks();
  }

  expandCeilingGrid(sideColCount) {
    const oldGrid = this.ceilingSolidGrid;
    const oldCols = this.ceilingCols;
    const rows = this.ceilingRows;
    const newCols = oldCols + sideColCount * 2;
    const newGrid = Array.from({ length: rows }, () => Array.from({ length: newCols }, () => false));

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < oldCols; col += 1) {
        newGrid[row][sideColCount + col] = oldGrid[row][col];
      }
    }

    this.ceilingSolidGrid = newGrid;
    this.ceilingCols = newCols;
  }

  createRavineSide(isLeft) {
    const original = this.originalPlayArea;
    const pa = this.playArea;
    let x;
    let width;

    if (isLeft) {
      x = pa.x;
      width = original.x - pa.x;
    } else {
      x = original.x + original.width;
      width = pa.x + pa.width - x;
    }

    if (width <= 0) return null;

    const ravineFloor = this.createWallFill(x, pa.y, width, pa.height, 0.6);
    const ravineFloorCollider = this.add.rectangle(
      x + width / 2,
      pa.y + RAVINE_FLOOR_COLLIDER_HEIGHT / 2,
      width,
      RAVINE_FLOOR_COLLIDER_HEIGHT,
      0x000000,
      0,
    );
    this.physics.add.existing(ravineFloorCollider, true);
    ravineFloorCollider.body.updateFromGameObject();
    return { ravineFloor, ravineFloorCollider };
  }

  setupRavineFloorColliders() {
    if (!this.player?.body || this.ravineFloorCollidersAdded) return;

    if (this.leftRavineFloorCollider) {
      this.physics.add.collider(this.player, this.leftRavineFloorCollider);
    }
    if (this.rightRavineFloorCollider) {
      this.physics.add.collider(this.player, this.rightRavineFloorCollider);
    }
    this.ravineFloorCollidersAdded = true;
  }

  resizeExpandedPlayVisuals() {
    const pa = this.playArea;
    const original = this.originalPlayArea;

    this.syncSkyBackground();

    if (this.grassLines.length >= 2) {
      this.grassLines[0].setPosition(original.x + original.width / 2, pa.y + pa.height - 2);
      this.grassLines[0].setSize(original.width, 4);
      this.grassLines[1].setPosition(original.x + original.width / 2, pa.y + pa.height - 6);
      this.grassLines[1].setSize(original.width, 2);
    }

    this.syncMainGroundCollider();
  }

  syncMainGroundCollider() {
    const original = this.originalPlayArea;
    const pa = this.playArea;
    this.ground.setPosition(original.x + original.width / 2, pa.y + pa.height - MAIN_GROUND_HEIGHT / 2);
    this.ground.setSize(original.width, MAIN_GROUND_HEIGHT);
    this.ground.body?.updateFromGameObject();
  }

  expandWorld(options = {}) {
    const { ceilingState = null } = options;
    if (this.hasExpandedWorld) return;
    this.hasExpandedWorld = true;

    const sideColCount = Math.ceil(SIDE_EXPANSION / CEILING_TILE_SIZE);

    this.playArea.x = EXPANDED_PLAY_AREA.x;
    this.playArea.width = EXPANDED_PLAY_AREA.width;

    this.expandCeilingGrid(sideColCount);
    if (ceilingState) {
      this.applyCeilingStateFromSave(ceilingState);
    }
    this.rebuildCeilingVisuals(true);

    const leftRavine = this.createRavineSide(true);
    if (leftRavine) {
      this.leftRavineFloor = leftRavine.ravineFloor;
      this.leftRavineFloorCollider = leftRavine.ravineFloorCollider;
    }

    const rightRavine = this.createRavineSide(false);
    if (rightRavine) {
      this.rightRavineFloor = rightRavine.ravineFloor;
      this.rightRavineFloorCollider = rightRavine.ravineFloorCollider;
    }

    this.resizeExpandedPlayVisuals();
  }

  serializeCeilingState() {
    if (!this.ceilingSolidGrid) return null;

    const dug = [];
    for (let row = 0; row < this.ceilingRows; row += 1) {
      for (let col = 0; col < this.ceilingCols; col += 1) {
        if (!this.ceilingSolidGrid[row][col]) {
          dug.push([col, row]);
        }
      }
    }

    return {
      cols: this.ceilingCols,
      rows: this.ceilingRows,
      dug,
      dig_marks: this.ceilingDigMarks.map((mark) => [mark.x, mark.y]),
    };
  }

  applyCeilingStateFromSave(ceilingState) {
    if (!ceilingState || !this.ceilingSolidGrid) return;

    if (Array.isArray(ceilingState.dig_marks)) {
      this.ceilingDigMarks = ceilingState.dig_marks
        .filter((mark) => Array.isArray(mark) && mark.length >= 2)
        .map(([x, y]) => ({ x, y }));
    }

    if (!Array.isArray(ceilingState.dug)) return;

    for (const cell of ceilingState.dug) {
      if (!Array.isArray(cell) || cell.length < 2) continue;
      const col = cell[0];
      const row = cell[1];
      if (row < 0 || col < 0 || row >= this.ceilingRows || col >= this.ceilingCols) continue;
      this.ceilingSolidGrid[row][col] = false;
    }
  }

  getLatestPersistedWorldRun(runsForGame) {
    if (!Array.isArray(runsForGame) || runsForGame.length === 0) return null;

    let latestRun = null;
    for (const runData of runsForGame) {
      if (runData?.runFileData?.world_expanded !== true) continue;
      if (!latestRun) {
        latestRun = runData;
        continue;
      }

      const latestRunNumber = Number.isInteger(latestRun.runNumber) ? latestRun.runNumber : -1;
      const candidateRunNumber = Number.isInteger(runData.runNumber) ? runData.runNumber : -1;
      if (candidateRunNumber > latestRunNumber) {
        latestRun = runData;
        continue;
      }

      if (candidateRunNumber === latestRunNumber && runData.index > latestRun.index) {
        latestRun = runData;
      }
    }

    return latestRun;
  }

  applyPersistedWorldState(pastRunsData) {
    const runsForGame = pastRunsData.filter((runData) => runData.runGame === GAME_ID);
    const worldRun = this.getLatestPersistedWorldRun(runsForGame);
    if (!worldRun?.runFileData?.world_expanded) return;

    this.expandWorld({ ceilingState: worldRun.runFileData.ceiling_state ?? null });
  }

  checkWorldExpansion() {
    if (!this.isCeilingDiggingEnabled()) return;
    if (this.hasExpandedWorld || !this.player?.active) return;
    const head = this.getCharacterHeadBounds(this.player);
    if (head.top < this.getCeilingOriginY()) {
      this.expandWorld();
      this.endTurn();
    }
  }

  isCeilingCellSolid(col, row) {
    if (!this.ceilingSolidGrid) return false;
    if (row < 0 || col < 0 || row >= this.ceilingRows || col >= this.ceilingCols) return false;
    return this.ceilingSolidGrid[row][col];
  }

  getCeilingCellWorldRect(col, row) {
    const originY = this.getCeilingOriginY();
    return {
      left: this.getCeilingX() + col * CEILING_TILE_SIZE,
      top: originY + row * CEILING_TILE_SIZE,
      right: this.getCeilingX() + (col + 1) * CEILING_TILE_SIZE,
      bottom: originY + (row + 1) * CEILING_TILE_SIZE,
    };
  }

  markCeilingDigAt(worldX, worldY) {
    if (!this.ceilingSolidGrid) return;

    const radius = CEILING_DIG_RADIUS;
    const originY = this.getCeilingOriginY();
    const minCol = Math.floor((worldX - radius - this.getCeilingX()) / CEILING_TILE_SIZE);
    const maxCol = Math.floor((worldX + radius - this.getCeilingX()) / CEILING_TILE_SIZE);
    const minRow = Math.floor((worldY - radius - originY) / CEILING_TILE_SIZE);
    const maxRow = Math.floor((worldY + radius - originY) / CEILING_TILE_SIZE);

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        if (!this.isCeilingCellSolid(col, row)) continue;

        const cell = this.getCeilingCellWorldRect(col, row);
        const closestX = Phaser.Math.Clamp(worldX, cell.left, cell.right);
        const closestY = Phaser.Math.Clamp(worldY, cell.top, cell.bottom);
        if (Phaser.Math.Distance.Between(worldX, worldY, closestX, closestY) <= radius) {
          this.ceilingSolidGrid[row][col] = false;
        }
      }
    }
  }

  isFeetOnSolidTop(feetY, cellTop) {
    return feetY >= cellTop - 2 && feetY <= cellTop + CEILING_TOP_LANDING_TOLERANCE;
  }

  findCeilingLandingSurface(feetLeft, feetRight, feetY, fallSpeed = 0) {
    const landingTolerance = CEILING_TOP_LANDING_TOLERANCE + Math.min(CEILING_FALL_LANDING_EXTRA, fallSpeed * 0.02);
    const originY = this.getCeilingOriginY();
    let landingSurfaceY = null;

    for (let sampleX = feetLeft + 2; sampleX <= feetRight - 2; sampleX += CEILING_TILE_SIZE / 2) {
      const col = Math.floor((sampleX - this.getCeilingX()) / CEILING_TILE_SIZE);
      if (col < 0 || col >= this.ceilingCols) continue;

      for (let row = this.ceilingRows - 1; row >= 0; row -= 1) {
        if (!this.isCeilingCellSolid(col, row)) continue;

        const cellTop = originY + row * CEILING_TILE_SIZE;
        if (feetY < cellTop - 2) continue;
        if (feetY > cellTop + landingTolerance) continue;

        if (landingSurfaceY === null || cellTop > landingSurfaceY) {
          landingSurfaceY = cellTop;
        }
        break;
      }
    }

    return landingSurfaceY;
  }

  resolvePlayerCeilingSolidContacts() {
    if (!this.player?.body || !this.ceilingSolidGrid) return;

    const body = this.player.body;
    const originY = this.getCeilingOriginY();
    const minCol = Math.floor((body.left - this.getCeilingX()) / CEILING_TILE_SIZE);
    const maxCol = Math.floor((body.right - this.getCeilingX()) / CEILING_TILE_SIZE);
    const minRow = Math.floor((body.top - originY) / CEILING_TILE_SIZE);
    const maxRow = Math.floor((body.bottom - originY) / CEILING_TILE_SIZE);
    let adjusted = false;

    for (let row = minRow; row <= maxRow; row += 1) {
      for (let col = minCol; col <= maxCol; col += 1) {
        if (!this.isCeilingCellSolid(col, row)) continue;

        const cell = this.getCeilingCellWorldRect(col, row);
        const overlapLeft = body.right - cell.left;
        const overlapRight = cell.right - body.left;
        const overlapTop = body.bottom - cell.top;
        const overlapBottom = cell.bottom - body.top;

        if (overlapLeft <= 0 || overlapRight <= 0 || overlapTop <= 0 || overlapBottom <= 0) continue;

        if (this.isFeetOnSolidTop(body.bottom, cell.top) && body.velocity.y >= 0) continue;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapBottom && body.velocity.y < 0) {
          this.player.y += overlapBottom;
          body.setVelocityY(0);
          adjusted = true;
          continue;
        }

        if (minOverlap === overlapLeft) {
          this.player.x -= overlapLeft;
          adjusted = true;
        } else if (minOverlap === overlapRight) {
          this.player.x += overlapRight;
          adjusted = true;
        } else if (minOverlap === overlapTop) {
          this.player.y -= overlapTop;
          adjusted = true;
        }
      }
    }

    if (adjusted) {
      body.updateFromGameObject();
    }
  }

  isPointInRavineColumn(x) {
    if (!this.hasExpandedWorld) return false;
    const original = this.originalPlayArea;
    const pa = this.playArea;
    return (x >= pa.x && x < original.x) || (x >= original.x + original.width && x < pa.x + pa.width);
  }

  getRavineFloorSurfaceY() {
    return this.playArea.y;
  }

  resolveRavineFloorLanding() {
    if (!this.hasExpandedWorld || !this.player?.body) return false;

    const body = this.player.body;
    if (body.velocity.y < 0) return false;
    if (!this.isPointInRavineColumn(body.center.x)) return false;

    const floorTop = this.getRavineFloorSurfaceY();
    const landingTolerance =
      CEILING_TOP_LANDING_TOLERANCE + Math.min(CEILING_FALL_LANDING_EXTRA, body.velocity.y * 0.02);

    if (body.bottom < floorTop - 2) return false;
    if (body.bottom > floorTop + landingTolerance) return false;

    const penetration = body.bottom - floorTop;
    if (penetration > 0.5) {
      this.player.y -= penetration;
      body.updateFromGameObject();
    }

    body.setVelocityY(0);
    return true;
  }

  resolvePlayerCeilingCollision() {
    if (!this.player?.body || !this.ceilingSolidGrid) return;

    this.playerSupportedByCeiling = false;
    this.playerSupportedByRavineFloor = false;
    this.ceilingSupportSurfaceY = null;

    const body = this.player.body;
    this.resolvePlayerCeilingSolidContacts();

    if (body.velocity.y < 0) return;

    if (this.resolveRavineFloorLanding()) {
      this.playerSupportedByRavineFloor = true;
      return;
    }

    const landingSurfaceY = this.findCeilingLandingSurface(
      body.left,
      body.right,
      body.bottom,
      body.velocity.y,
    );
    if (landingSurfaceY === null) return;

    const penetration = body.bottom - landingSurfaceY;
    if (penetration < -4) return;

    if (penetration > 0.5) {
      this.player.y -= penetration;
      body.updateFromGameObject();
    }

    body.setVelocityY(0);
    this.playerSupportedByCeiling = true;
    this.ceilingSupportSurfaceY = landingSurfaceY;
  }

  isPlayerSupported() {
    if (!this.player?.body) return false;
    return this.player.body.blocked.down || this.playerSupportedByCeiling || this.playerSupportedByRavineFloor;
  }

  getCharacterHeadBounds(sprite) {
    const bounds = this.getCharacterBodyBounds(sprite);
    return {
      left: bounds.left,
      right: bounds.left + bounds.width,
      top: bounds.top,
      centerX: bounds.centerX,
      width: bounds.width,
    };
  }

  isCharacterNearCeiling(sprite) {
    const head = this.getCharacterHeadBounds(sprite);
    if (head.right < this.playArea.x || head.left > this.playArea.x + this.playArea.width) return false;
    return head.top <= this.playArea.y + CEILING_DIG_RADIUS * 1.5;
  }

  digCeilingAt(worldX, worldY) {
    if (!this.ceilingRenderTexture || !this.digBrush) return;
    const originY = this.getCeilingOriginY();
    if (worldY < originY || worldY > this.playArea.y) return;
    if (worldX < this.getCeilingX() || worldX > this.getCeilingX() + this.getCeilingWidth()) return;

    this.eraseCeilingVisualAt(worldX, worldY);
    this.recordCeilingDigMark(worldX, worldY);
    this.markCeilingDigAt(worldX, worldY);
  }

  updateCeilingDigging() {
    if (!this.isCeilingDiggingEnabled()) return;
    if (this.movementLocked || !this.player?.body) return;

    const body = this.player.body;
    if (body.velocity.y >= 0) return;
    if (!this.isCharacterNearCeiling(this.player)) return;

    const head = this.getCharacterHeadBounds(this.player);
    const digY =
      head.top <= this.playArea.y ? head.top + CEILING_DIG_RADIUS * 0.35 : this.playArea.y - CEILING_DIG_RADIUS * 0.15;
    const sampleStep = Math.max(8, CEILING_DIG_RADIUS * 0.75);

    for (let sampleX = head.left; sampleX <= head.right; sampleX += sampleStep) {
      this.digCeilingAt(sampleX, digY);
    }
    this.digCeilingAt(head.centerX, digY);
  }

  cleanupCeiling() {
    this.ceilingRenderTexture?.destroy();
    this.ceilingRenderTexture = null;
    this.ceilingBacking?.destroy();
    this.ceilingBacking = null;
    this.digBrush?.destroy();
    this.digBrush = null;
    this.ceilingSolidGrid = null;
    this.ceilingDigMarks = [];
    this.ceilingCols = 0;
    this.ceilingRows = 0;
    this.ceilingOriginY = 0;
    this.playerSupportedByCeiling = false;
    this.playerSupportedByRavineFloor = false;
    this.ceilingSupportSurfaceY = null;
    this.skyBackground?.destroy();
    this.skyBackground = null;
    this.skyBackgroundMask?.destroy();
    this.skyBackgroundMask = null;
    this.leftRavineFloor?.destroy();
    this.leftRavineFloor = null;
    this.rightRavineFloor?.destroy();
    this.rightRavineFloor = null;
    this.leftRavineFloorCollider?.destroy();
    this.leftRavineFloorCollider = null;
    this.rightRavineFloorCollider?.destroy();
    this.rightRavineFloorCollider = null;
    this.events.off("postupdate", this.resolvePlayerCeilingCollision, this);
    this.events.off("postupdate", this.tryCompleteTurnCapture, this);
  }

  update() {
    if (this.finishShadowsKey && !this.movementLocked && Phaser.Input.Keyboard.JustDown(this.finishShadowsKey)) {
      this.finishAllShadowReplays();
    }

    if (!this.player?.body || !this.cursors) return;

    const body = this.player.body;
    body.setVelocityX(0);

    if (!this.movementLocked) {
      if (this.cursors.left.isDown) {
        body.setVelocityX(-this.speed);
        this.player.setFlipX(true);
      } else if (this.cursors.right.isDown) {
        body.setVelocityX(this.speed);
        this.player.setFlipX(false);
      }

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.isPlayerSupported()) {
        body.setVelocityY(-this.jumpSpeed);
      }
      if (this.captureDownloadKey && Phaser.Input.Keyboard.JustDown(this.captureDownloadKey)) {
        this.endTurn();
      }
    }

    const halfW = body.width / 2;

    this.player.x = Phaser.Math.Clamp(
      this.player.x,
      this.playArea.x + halfW,
      this.playArea.x + this.playArea.width - halfW,
    );
    this.checkWorldExpansion();
    this.updateCeilingDigging();
    this.recordPlayerFrame();
    this.updateShadowInteractions();
    this.updateFlowerInteraction();
  }

  isPlayerMotionless() {
    if (!this.player?.body) return true;
    const body = this.player.body;
    return (
      Math.abs(body.velocity.x) <= PLAYER_STOP_VELOCITY_THRESHOLD &&
      Math.abs(body.velocity.y) <= PLAYER_STOP_VELOCITY_THRESHOLD
    );
  }

  isPlayerStopped() {
    if (!this.isPlayerMotionless() || !this.isPlayerSupported()) {
      this.turnEndSettledFrameCount = 0;
      return false;
    }
    this.turnEndSettledFrameCount += 1;
    return this.turnEndSettledFrameCount >= TURN_END_SETTLED_FRAME_COUNT;
  }

  isPlayerOnFlower() {
    if (!this.flowerPosition || !this.player?.active) return false;
    const bounds = this.getCharacterBodyBounds(this.player);
    const dx = Math.abs(bounds.centerX - this.flowerPosition.x);
    const dy = Math.abs(bounds.bottom - this.flowerPosition.y);
    return dx <= FLOWER_PROXIMITY_X && dy <= FLOWER_PROXIMITY_Y;
  }

  boundsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  isPlayerOverlappingShadow(replay) {
    if (!this.player?.active || !replay.sprite?.active) return false;
    const playerBounds = this.getCharacterBodyBounds(this.player);
    const shadowBounds = this.getCharacterBodyBounds(replay.sprite);
    if (this.boundsOverlap(playerBounds, shadowBounds)) return true;

    return (
      Phaser.Math.Distance.Between(
        playerBounds.centerX,
        playerBounds.bottom,
        shadowBounds.centerX,
        shadowBounds.bottom,
      ) < SHADOW_MEET_DISTANCE
    );
  }

  isFlowerDialogComplete() {
    return this.hasCompletedFlowerOnce;
  }

  areAllShadowJokesComplete() {
    const shadowsWithJokes = this.shadowReplays.filter((replay) => replay.jokeLine);
    if (shadowsWithJokes.length === 0) return false;
    return shadowsWithJokes.every((replay) => replay.hasSpokenJoke);
  }

  isShadowJokeInteractionLocked() {
    return this.time.now < this.shadowJokeLockUntil;
  }

  updateShadowInteractions() {
    if (!this.player?.active || !this.isCeilingDiggingEnabled()) return;
    if (!this.isFlowerDialogComplete()) return;
    if (this.areAllShadowJokesComplete()) return;

    let overlappingShadow = null;
    for (const replay of this.shadowReplays) {
      if (!replay.jokeLine || !replay.sprite?.active) continue;

      if (this.isPlayerOverlappingShadow(replay)) {
        overlappingShadow = replay;
        if (!replay.hasSpokenJoke && !this.isShadowJokeInteractionLocked()) {
          replay.hasSpokenJoke = true;
          this.shadowJokeLockUntil = this.time.now + SHADOW_JOKE_DISPLAY_MS;
          this.showStoryText(replay.jokeLine, {
            speaker: replay.playerTurn,
            autoHideMs: SHADOW_JOKE_DISPLAY_MS,
          });
        }
      }
    }

    if (
      !overlappingShadow &&
      this.storyTextSpeaker &&
      this.storyTextSpeaker !== "flower" &&
      !this.isPlayerOnFlower() &&
      !this.isShadowJokeInteractionLocked()
    ) {
      this.hideStoryText();
    }
  }

  getCharacterTextColor(playerTurn) {
    const style = this.getCharacterStyle(playerTurn);
    return style.textColor ?? FLOWER_TEXT_COLOR;
  }

  updateFlowerInteraction() {
    if (!this.flowerPosition || !this.player?.active) return;

    if (!this.isCeilingDiggingEnabled()) {
      if (this.wasOnFlower) {
        this.wasOnFlower = false;
        this.hideStoryText();
      }
      return;
    }

    const onFlower = this.isPlayerOnFlower();

    if (!onFlower) {
      if (this.wasOnFlower) {
        this.hasLeftFlowerSinceLastLine = true;
      }
      this.wasOnFlower = false;
      if (this.storyTextSpeaker === "flower") {
        this.hideStoryText();
      }
      return;
    }

    if (this.wasOnFlower) return;
    if (!this.hasLeftFlowerSinceLastLine) return;

    if (this.flowerLineIndex >= TURN_4_FLOWER_LINES.length) {
      if (!this.areAllShadowJokesComplete()) {
        this.wasOnFlower = true;
        return;
      }
      this.flowerLineIndex = 0;
    }

    this.showStoryText(TURN_4_FLOWER_LINES[this.flowerLineIndex]);
    this.flowerLineIndex += 1;
    if (this.flowerLineIndex >= TURN_4_FLOWER_LINES.length) {
      this.hasCompletedFlowerOnce = true;
    }
    this.hasLeftFlowerSinceLastLine = false;
    this.wasOnFlower = true;
  }

  showStoryText(text, options = {}) {
    const { autoHideMs = 0, speaker = null } = options;
    const isFlowerText = speaker === null;

    if (this.storyHideTimer) {
      this.storyHideTimer.remove(false);
      this.storyHideTimer = null;
    }

    this.storyTextSpeaker = isFlowerText ? "flower" : this.normalizePlayerTurn(speaker);
    this.storyText.setWordWrapWidth(FLOWER_TEXT_WRAP_VISUAL_WIDTH / FLOWER_TEXT_SCALE, true);
    this.storyText.setColor(isFlowerText ? FLOWER_TEXT_COLOR : this.getCharacterTextColor(speaker));
    this.storyText.setText(text);
    this.storyText.setVisible(true);

    if (autoHideMs > 0) {
      this.storyHideTimer = this.time.delayedCall(autoHideMs, () => {
        this.hideStoryText();
      });
    }
  }

  hideStoryText() {
    if (this.storyHideTimer) {
      this.storyHideTimer.remove(false);
      this.storyHideTimer = null;
    }
    this.storyTextSpeaker = null;
    this.storyText.setVisible(false);
  }

  normalizePlayerTurn(rawPlayerTurn) {
    if (typeof rawPlayerTurn !== "string") return INITIAL_PLAYER;
    const normalized = rawPlayerTurn.trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(CHARACTER_STYLES, normalized) ? normalized : INITIAL_PLAYER;
  }

  getCharacterStyle(playerTurn) {
    const normalizedTurn = this.normalizePlayerTurn(playerTurn);
    return CHARACTER_STYLES[normalizedTurn] ?? CHARACTER_STYLES[INITIAL_PLAYER];
  }

  getOppositePlayerTurn(playerTurn) {
    const normalizedTurn = this.normalizePlayerTurn(playerTurn);
    return normalizedTurn === "pulsar" ? "hiike" : "pulsar";
  }

  getCharacterBodyBounds(sprite) {
    const displayWidth = sprite.displayWidth;
    const displayHeight = sprite.displayHeight;
    const bodyWidth = displayWidth * CHARACTER_BODY_WIDTH_RATIO;
    const bodyHeight = displayHeight * CHARACTER_BODY_HEIGHT_RATIO;
    const offsetX = displayWidth * CHARACTER_BODY_OFFSET_X_RATIO;
    const offsetY = displayHeight * CHARACTER_BODY_OFFSET_Y_RATIO;
    const originX = sprite.originX ?? 0.5;
    const originY = sprite.originY ?? 0.5;
    const left = sprite.x - displayWidth * originX + offsetX;
    const top = sprite.y - displayHeight * originY + offsetY;

    return {
      left,
      top,
      bottom: top + bodyHeight,
      right: left + bodyWidth,
      width: bodyWidth,
      height: bodyHeight,
      centerX: left + bodyWidth / 2,
      topY: top,
    };
  }

  createCharacterStandPlatform(ownerSprite) {
    const bounds = this.getCharacterBodyBounds(ownerSprite);
    const platform = this.add.rectangle(
      bounds.centerX,
      bounds.topY + CHARACTER_STAND_PLATFORM_HEIGHT / 2,
      bounds.width,
      CHARACTER_STAND_PLATFORM_HEIGHT,
      0x000000,
      0,
    );
    this.physics.add.existing(platform, true);
    platform.setData("ownerSprite", ownerSprite);
    this.characterStandPlatforms.add(platform);
    return platform;
  }

  syncCharacterStandPlatform(platform, ownerSprite) {
    if (!platform?.body || !ownerSprite?.active) return;

    const bounds = this.getCharacterBodyBounds(ownerSprite);
    platform.setPosition(bounds.centerX, bounds.topY + CHARACTER_STAND_PLATFORM_HEIGHT / 2);
    platform.body.setSize(bounds.width, CHARACTER_STAND_PLATFORM_HEIGHT);
    platform.body.updateFromGameObject();
  }

  syncCharacterStandPlatforms() {
    for (const replay of this.shadowReplays) {
      if (replay.standPlatform && replay.sprite?.active) {
        this.syncCharacterStandPlatform(replay.standPlatform, replay.sprite);
      }
    }

    if (this.playerStandPlatform && this.player?.active) {
      this.syncCharacterStandPlatform(this.playerStandPlatform, this.player);
    }
  }

  canPlayerLandOnCharacterPlatform(player, platform) {
    if (platform.getData("ownerSprite") === player) return false;
    if (!player?.body || !platform?.body) return false;
    if (player.body.velocity.y < 0) return false;

    return player.body.bottom <= platform.body.top + CHARACTER_STAND_PLATFORM_LANDING_MARGIN;
  }

  setupCharacterStandColliders() {
    if (!this.player || this.characterStandColliderAdded) return;

    this.physics.add.collider(
      this.player,
      this.characterStandPlatforms,
      null,
      this.canPlayerLandOnCharacterPlatform,
      this,
    );
    this.characterStandColliderAdded = true;
  }

  preUpdateCharacters() {
    this.updateShadowReplays();
    this.syncCharacterStandPlatforms();
  }

  createPlayer() {
    if (this.player?.active) return;

    const playerStyle = this.getCharacterStyle(this.playerTurn);
    this.player = this.physics.add
      .sprite(this.originalPlayArea.x + 95, this.playArea.y + this.playArea.height - 22, playerStyle.textureKey)
      .setScale(CHARACTER_SCALE);
    this.player.setDepth(5);
    this.player.setAlpha(1);
    this.player.body.setAllowGravity(true);
    this.player.body.setCollideWorldBounds(false);
    this.player.body.setSize(this.player.width * CHARACTER_BODY_WIDTH_RATIO, this.player.height * CHARACTER_BODY_HEIGHT_RATIO);
    this.player.body.setOffset(this.player.width * CHARACTER_BODY_OFFSET_X_RATIO, this.player.height * CHARACTER_BODY_OFFSET_Y_RATIO);
    this.player.body.setGravityY(950);
    this.physics.add.collider(this.player, this.ground);
    this.setupRavineFloorColliders();
    this.playerStandPlatform = this.createCharacterStandPlatform(this.player);
  }

  setCurrentPlayerTurn(playerTurn) {
    this.playerTurn = this.normalizePlayerTurn(playerTurn);
  }

  resetActionRecording() {
    this.actionHistory.length = 0;
    this.recordingStartTime = this.time.now;
    this.recordPlayerFrame();
  }

  recordPlayerFrame() {
    if (!this.player) return;

    const legacy = toLegacyCoords(this.player.x, this.player.y);
    this.actionHistory.push({
      time: this.time.now - this.recordingStartTime,
      x: legacy.x,
      y: legacy.y,
      flipX: this.player.flipX,
    });
  }

  startShadowReplay(frames, playerTurn = INITIAL_PLAYER, runNumber = null) {
    if (!Array.isArray(frames) || frames.length < 2) return;

    const firstFrame = frames[0];
    const style = this.getCharacterStyle(playerTurn);
    const shadow = this.add
      .sprite(firstFrame.x, firstFrame.y, style.textureKey)
      .setScale(CHARACTER_SCALE)
      .setDepth(4);
    shadow.setTint(style.shadowTint);
    shadow.setAlpha(style.shadowAlpha);
    shadow.setFlipX(firstFrame.flipX);

    const standPlatform = this.createCharacterStandPlatform(shadow);
    const jokesInOrder = [SHADOW_JOKES_BY_RUN[1], SHADOW_JOKES_BY_RUN[2], SHADOW_JOKES_BY_RUN[3]];
    const jokeLine =
      (Number.isInteger(runNumber) && SHADOW_JOKES_BY_RUN[runNumber]) ||
      jokesInOrder[this.shadowReplays.length] ||
      null;

    this.shadowReplays.push({
      sprite: shadow,
      standPlatform,
      frames,
      playerTurn: this.normalizePlayerTurn(playerTurn),
      runNumber,
      jokeLine,
      hasSpokenJoke: false,
      startTime: this.time.now,
      frameIndex: 0,
      isComplete: false,
    });
  }

  async loadPastRunReplays() {
    const runFilePaths = await this.discoverPastRunFiles();
    const pastRunsData = await this.loadPastRunsData(runFilePaths);
    this.applyPastRunsSnapshot(pastRunsData);
    this.applyPersistedWorldState(pastRunsData);
    this.startPastRunReplays(pastRunsData);
  }

  extractRunNumberFromPath(runFilePath) {
    if (typeof runFilePath !== "string") return null;
    const pathMatch = runFilePath.match(/\/(\d+)\/run\.json$/);
    if (!pathMatch) return null;
    const runNumber = Number.parseInt(pathMatch[1], 10);
    return Number.isInteger(runNumber) && runNumber > 0 ? runNumber : null;
  }

  resolveRunNumber(runFilePath, runFileData) {
    const explicitRunNumber =
      Number.isInteger(runFileData?.run_number) && runFileData.run_number > 0 ? runFileData.run_number : null;
    if (explicitRunNumber !== null) return explicitRunNumber;
    return this.extractRunNumberFromPath(runFilePath);
  }

  async loadPastRunsData(runFilePaths) {
    if (!Array.isArray(runFilePaths) || runFilePaths.length === 0) return [];

    const runDataPromises = runFilePaths.map(async (filePath, index) => {
      try {
        const response = await fetchNoStore(`./${filePath}`);
        if (!response.ok) return null;

        const runFileData = await response.json();
        const runGame = typeof runFileData?.game === "string" ? runFileData.game : GAME_ID;

        return {
          filePath,
          index,
          runFileData,
          runGame,
          runNumber: this.resolveRunNumber(filePath, runFileData),
          replayFrames: this.parseReplayFrames(runFileData),
          replayPlayerTurn: this.normalizePlayerTurn(runFileData?.player_turn ?? runFileData?.playerTurn),
        };
      } catch (error) {
        // Missing or invalid run files should not block startup.
        console.warn(`Unable to load replay file "${filePath}":`, error);
        return null;
      }
    });

    const loadedRunData = await Promise.all(runDataPromises);
    return loadedRunData.filter((runData) => runData !== null);
  }

  getLatestRunDataForGame(runsForGame) {
    if (!Array.isArray(runsForGame) || runsForGame.length === 0) return null;

    let latestRunData = runsForGame[0];
    let latestSortableRunNumber = Number.isInteger(latestRunData.runNumber) ? latestRunData.runNumber : -1;

    for (let index = 1; index < runsForGame.length; index += 1) {
      const candidateRunData = runsForGame[index];
      const candidateSortableRunNumber = Number.isInteger(candidateRunData.runNumber) ? candidateRunData.runNumber : -1;

      if (candidateSortableRunNumber > latestSortableRunNumber) {
        latestRunData = candidateRunData;
        latestSortableRunNumber = candidateSortableRunNumber;
        continue;
      }

      if (
        candidateSortableRunNumber === latestSortableRunNumber &&
        candidateRunData.index > latestRunData.index
      ) {
        latestRunData = candidateRunData;
      }
    }

    return latestRunData;
  }

  applyPastRunsSnapshot(pastRunsData) {
    const runsForGame = pastRunsData.filter((runData) => runData.runGame === GAME_ID);
    this.loadedRunCountForGame = runsForGame.length;
    this.loadedRunMaxNumberForGame = runsForGame.reduce((maxRunNumber, runData) => {
      if (!Number.isInteger(runData.runNumber)) return maxRunNumber;
      return Math.max(maxRunNumber, runData.runNumber);
    }, 0);

    const latestRunData = this.getLatestRunDataForGame(runsForGame);
    if (!latestRunData) return;

    const nextPlayerTurn = this.getOppositePlayerTurn(latestRunData.replayPlayerTurn);
    this.setCurrentPlayerTurn(nextPlayerTurn);
  }

  startPastRunReplays(pastRunsData) {
    for (const runData of pastRunsData) {
      if (runData.runGame !== GAME_ID) continue;
      if (runData.replayFrames.length < 2) continue;
      this.startShadowReplay(runData.replayFrames, runData.replayPlayerTurn, runData.runNumber);
    }
  }

  async discoverPastRunFiles() {
    const discoveredFilePaths = new Set();

    const crawlRunDirectory = async (directoryPath) => {
      const response = await fetchNoStore(`./${directoryPath}`);
      if (!response.ok) return;

      const html = await response.text();
      const links = html.matchAll(/href="([^"]+)"/g);
      for (const link of links) {
        const href = link[1];
        if (typeof href !== "string") continue;
        if (href.startsWith("../") || href.startsWith("/") || href.includes("://")) continue;

        const decodedHref = decodeURIComponent(href.split("?")[0].split("#")[0]);
        if (!decodedHref) continue;

        if (decodedHref.endsWith("/")) {
          await crawlRunDirectory(`${directoryPath}${decodedHref}`);
          continue;
        }

        if (decodedHref === "run.json") {
          discoveredFilePaths.add(`${directoryPath}${decodedHref}`);
        }
      }
    };

    try {
      await crawlRunDirectory("runs/");
    } catch (error) {
      // Directory listing may not be available depending on host configuration.
    }

    if (discoveredFilePaths.size === 0) {
      const probedRunFiles = await this.discoverPastRunFilesByProbing();
      for (const runFilePath of probedRunFiles) {
        discoveredFilePaths.add(runFilePath);
      }
    }

    return Array.from(discoveredFilePaths).sort((pathA, pathB) => {
      const runNumberA = this.extractRunNumberFromPath(pathA) ?? 0;
      const runNumberB = this.extractRunNumberFromPath(pathB) ?? 0;
      if (runNumberA !== runNumberB) return runNumberA - runNumberB;
      return pathA.localeCompare(pathB);
    });
  }

  async runFileExists(runFilePath) {
    const requestOptions = {};
    const runFileUrl = `./${runFilePath}`;

    try {
      const headResponse = await fetchNoStore(runFileUrl, {
        ...requestOptions,
        method: "HEAD",
      });
      if (headResponse.ok) return true;
      if (headResponse.status !== 405) return false;
    } catch (error) {
      // Fall back to GET when HEAD is unsupported or blocked.
    }

    try {
      const getResponse = await fetchNoStore(runFileUrl, requestOptions);
      return getResponse.ok;
    } catch (error) {
      return false;
    }
  }

  async discoverPastRunFilesByProbing() {
    const discoveredFilePaths = [];
    const maxRunLookups = 200;
    const maxConsecutiveMisses = 3;
    let consecutiveMisses = 0;

    for (let runNumber = 1; runNumber <= maxRunLookups; runNumber += 1) {
      const runFilePath = `runs/${runNumber}/run.json`;
      const exists = await this.runFileExists(runFilePath);

      if (exists) {
        discoveredFilePaths.push(runFilePath);
        consecutiveMisses = 0;
        continue;
      }

      consecutiveMisses += 1;
      if (consecutiveMisses >= maxConsecutiveMisses) break;
    }

    return discoveredFilePaths;
  }

  parseReplayFrames(runFileData) {
    if (!Array.isArray(runFileData?.frames)) return [];
    return runFileData.frames
      .filter(
        (frame) =>
          frame &&
          Number.isFinite(frame.time) &&
          Number.isFinite(frame.x) &&
          Number.isFinite(frame.y) &&
          typeof frame.flipX === "boolean",
      )
      .map((frame) => {
        const world = toWorldCoords(frame.x, frame.y);
        return {
          time: frame.time,
          x: world.x,
          y: world.y,
          flipX: frame.flipX,
        };
      })
      .sort((a, b) => a.time - b.time);
  }

  getNextRunNumber() {
    return Math.max(this.loadedRunMaxNumberForGame, this.loadedRunCountForGame) + 1;
  }

  isCeilingDiggingEnabled() {
    return this.getNextRunNumber() === CEILING_DIGGING_RUN_NUMBER;
  }

  finishAllShadowReplays() {
    for (const replay of this.shadowReplays) {
      if (replay.isComplete) continue;

      const { sprite, frames } = replay;
      if (!sprite?.active || !Array.isArray(frames) || frames.length === 0) {
        replay.isComplete = true;
        continue;
      }

      const lastFrame = frames[frames.length - 1];
      sprite.setPosition(lastFrame.x, lastFrame.y);
      sprite.setFlipX(lastFrame.flipX);
      replay.frameIndex = frames.length - 1;
      replay.isComplete = true;
    }

    this.syncCharacterStandPlatforms();
  }

  updateShadowReplays() {
    if (this.shadowReplays.length === 0) return;

    const now = this.time.now;
    this.shadowReplays = this.shadowReplays.filter((replay) => {
      const { sprite, frames } = replay;
      if (!sprite?.active || frames.length === 0) return false;
      if (replay.isComplete) return true;

      const elapsed = now - replay.startTime;
      const lastFrame = frames[frames.length - 1];

      if (elapsed >= lastFrame.time) {
        sprite.setPosition(lastFrame.x, lastFrame.y);
        sprite.setFlipX(lastFrame.flipX);
        replay.isComplete = true;
        return true;
      }

      while (replay.frameIndex < frames.length - 2 && frames[replay.frameIndex + 1].time <= elapsed) {
        replay.frameIndex += 1;
      }

      const currentFrame = frames[replay.frameIndex];
      const nextFrame = frames[replay.frameIndex + 1];
      const span = Math.max(nextFrame.time - currentFrame.time, 1);
      const progress = Phaser.Math.Clamp((elapsed - currentFrame.time) / span, 0, 1);

      sprite.x = Phaser.Math.Linear(currentFrame.x, nextFrame.x, progress);
      sprite.y = Phaser.Math.Linear(currentFrame.y, nextFrame.y, progress);
      sprite.setFlipX(currentFrame.flipX);
      return true;
    });
  }

  initRecording() {
    if (typeof window.GameRecorder !== "function") {
      return;
    }

    const soundManager = this.sound;
    const hasWebAudioOutput = Boolean(soundManager?.context && soundManager?.masterVolumeNode);
    const audioContext = hasWebAudioOutput ? soundManager.context : null;
    const audioNode = hasWebAudioOutput ? soundManager.masterVolumeNode : null;

    try {
      this.recorder = new window.GameRecorder({
        canvas: this.sys.game.canvas,
        audioContext,
        audioNode,
        filenamePrefix: "company-of-ourselves",
      });
      this.recorder.start();
    } catch (error) {
      this.recorder = null;
      console.warn("Unable to start recorder:", error);
    }
  }

  endTurn(options = {}) {
    const { announce = true } = options;
    if (this.hasTriggeredTurnEndSequence) return;
    if (this.captureDownloadInProgress || this.awaitingCaptureAfterStop) return;
    if (this.hasDownloadedCapture) {
      if (announce) {
        this.showStoryText("Recording already downloaded.", { autoHideMs: 1300 });
      }
      return;
    }
    if (!this.recorder) {
      if (announce) {
        this.showStoryText("Recording unavailable in this browser.", { autoHideMs: 1500 });
      }
      return;
    }

    this.hasTriggeredTurnEndSequence = true;
    this.cameras.main.flash(500, 255, 255, 255, true);
    this.switchMusicToLight();
    this.awaitingCaptureAfterStop = true;
    this.turnEndRequestedAt = this.time.now;
    this.turnEndSettledFrameCount = 0;
    this.lockMovement();
  }

  tryCompleteTurnCapture() {
    if (!this.awaitingCaptureAfterStop || this.captureDownloadInProgress) return;

    const elapsed = this.time.now - this.turnEndRequestedAt;
    const timedOut = elapsed >= TURN_END_SETTLE_TIMEOUT_MS;
    const minRecordElapsed = !this.hasExpandedWorld || elapsed >= TURN_END_MIN_RECORD_MS;
    if ((!this.isPlayerStopped() || !minRecordElapsed) && !timedOut) return;

    this.awaitingCaptureAfterStop = false;
    this.captureDownloadInProgress = true;

    this.createCaptureZip()
      .then(() => {
        this.hasDownloadedCapture = true;
      })
      .catch((error) => {
        console.warn("Unable to save recording:", error);
        this.showStoryText("Could not save recording.", { autoHideMs: 1600 });
      })
      .finally(() => {
        this.captureDownloadInProgress = false;
        this.recorder = null;
      });
  }

  lockMovement() {
    this.movementLocked = true;
    if (!this.player?.body) return;
    this.player.body.setVelocityX(0);
  }

  async createCaptureZip() {
    if (typeof window.JSZip !== "function") {
      throw new Error("JSZip is unavailable.");
    }

    const recording = await this.recorder.stopAndGetBlob();
    const zip = new window.JSZip();
    const runNumber = this.getNextRunNumber();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const zipName = `${GAME_ID}-capture-${timestamp}.zip`;

    const movementData = {
      game: GAME_ID,
      run_number: runNumber,
      exportedAt: new Date().toISOString(),
      player_turn: this.playerTurn,
      frameCount: this.actionHistory.length,
      durationMs: this.actionHistory.length ? this.actionHistory[this.actionHistory.length - 1].time : 0,
      frames: this.actionHistory,
    };

    if (this.hasExpandedWorld) {
      movementData.world_expanded = true;
      movementData.ceiling_state = this.serializeCeilingState();
    }

    zip.file("run/run.webm", recording.blob);
    zip.file("run/run.json", JSON.stringify(movementData, null, 2));
    const instructionsResponse = await fetchNoStore("assets/instructions.txt");
    const instructionsContent = await instructionsResponse.text();
    zip.file("instructions.txt", instructionsContent);

    const zipBlob = await zip.generateAsync({ type: "blob" });
    this.triggerFileDownload(zipBlob, zipName);
  }

  triggerFileDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  cleanupRecording() {
    if (!this.recorder) return;
    if (!this.captureDownloadInProgress) {
      this.recorder.dispose();
    }
    this.recorder = null;
  }

  cleanupShadowReplays() {
    for (const replay of this.shadowReplays) {
      replay.standPlatform?.destroy();
      replay.sprite?.destroy();
    }
    this.shadowReplays = [];
    this.playerStandPlatform?.destroy();
    this.playerStandPlatform = null;
    this.characterStandPlatforms?.clear(true, true);
    this.characterStandColliderAdded = false;
  }

  startMusicLoop() {
    if (this.musicStarted) return;
    this.musicStarted = true;
    this.playNextTrack();
  }

  switchMusicToLight() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
    }

    this.musicStarted = true;
    const lightIndex = this.musicQueue.indexOf("light");
    this.musicIndex = lightIndex >= 0 ? lightIndex : 0;
    this.currentMusic = this.sound.add("light", { volume: 0.35, loop: true });
    this.currentMusic.play();
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
    if (this.storyHideTimer) {
      this.storyHideTimer.remove(false);
      this.storyHideTimer = null;
    }
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
  scene: [PreloadScene, MainScene],
  backgroundColor: "#3a2f1f",
  scale: {
    mode: Phaser.Scale.NONE,
  },
};

new Phaser.Game(config);
