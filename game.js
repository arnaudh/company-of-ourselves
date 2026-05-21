const SOURCE_SCREENSHOT_WIDTH = 601;
const SOURCE_SCREENSHOT_HEIGHT = 399;
const GAME_SCALE_FACTOR = 1.3;

const GAME_WIDTH = Math.round(SOURCE_SCREENSHOT_WIDTH * GAME_SCALE_FACTOR);
const GAME_HEIGHT = Math.round(SOURCE_SCREENSHOT_HEIGHT * GAME_SCALE_FACTOR);

const BASE_PLAY_AREA_Y_RATIO = 0.515625;
const BASE_PLAY_AREA_HEIGHT_RATIO = 0.234375;
const PLAY_AREA_WIDTH = Math.round(GAME_WIDTH * 0.9);
const PLAY_AREA_HEIGHT = Math.round(GAME_HEIGHT * BASE_PLAY_AREA_HEIGHT_RATIO * 1.5);
const PLAY_AREA = {
  x: Math.round((GAME_WIDTH - PLAY_AREA_WIDTH) / 2),
  y: Math.round(GAME_HEIGHT * (BASE_PLAY_AREA_Y_RATIO + BASE_PLAY_AREA_HEIGHT_RATIO * 0.2)),
  width: PLAY_AREA_WIDTH,
  height: PLAY_AREA_HEIGHT,
};

const GAME_ID = "company-of-ourselves";
const INITIAL_PLAYER = "pulsar";
const PULSAR_SHADOW_MEET_DISTANCE = 34;
const PULSAR_INTRO_LINE_DURATION_MS = 4600;
const PULSAR_DOCUMENT_SPAWN_DELAY_MS = 3000;
const DOCUMENT_PICKUP_DISTANCE = 32;
const HANGMAN_WORDS = ["THE", "HANKERS"];
const HANGMAN_SECRET = HANGMAN_WORDS.join(" ");
const HANGMAN_PHRASE_SLOTS = [...HANGMAN_WORDS[0], " ", ...HANGMAN_WORDS[1]];
const FLOWER_BUTTON_DISTANCE = 36;
const LETTER_TILE_SIZE = 32;
const LETTER_TILE_GAP = 22;
const LETTER_TILE_ROW_GAP = 42;
const LETTER_TILE_COLS = 13;
const LETTER_TILE_FONT_SIZE = 20;
const FALLING_LETTER_GRAVITY = 900;
const HANGMAN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const HANGMAN_LETTER_COUNT = HANGMAN_ALPHABET.length;
const STORY_TEXT_SCALE = 0.5;
const STORY_TEXT_WRAP_VISUAL_WIDTH = PLAY_AREA.width;
const STORY_TEXT_DEFAULT_COLOR = "#ffd36e";
const STORY_TEXT_DEFAULT_AUTO_HIDE_MS = 1800;
const fetchNoStore = (resource, options = {}) => fetch(resource, { ...options, cache: "no-store" });
const PULSAR_INTRO_LINES = [
  "It looks like it's just ourselves here.",
  "I mean, I _was_ here, but now... _you_ are here.",
  "I have instructions that need to be passed along.",
  "It all seems cryptic to me, but maybe you will figure it out.",
  "And think of a way out of here for both of us.",
  "If not, then at least we will have\nthe company of ourselves...",
];
const FLOWER_WHISPER_LINE = "This flower is trying to tell me something";
const FLOWER_MOVEMENT_LINE = "this flower does not like movement it seems";
const FLOWER_RELAX_LINE = "Maybe i should just sit relax and think for a moment";
const FLOWER_BORED_LINE =
  "I am getting bored watching this flower , maybe i should start writing a Letter";
const FLOWER_MEMORY_LINE =
  "Feels good to take time sometimes, my memory starts coming back : We were a team before !";
const FLOWER_BORED_DELAY_MS = 2 * 60 * 1000;
const FLOWER_MEMORY_DELAY_MS = 3 * 60 * 1000;
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
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x3a2f1f);

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
    this.storyEventsFired = new Set();
    this.flowerPosition = null;
    this.wasNearFlower = false;
    this.hasReachedFlower = false;
    this.speed = 170;
    this.jumpSpeed = 430;
    this.ground = null;
    this.musicQueue = ["sad", "sad", "light", "light"];
    this.musicIndex = 0;
    this.currentMusic = null;
    this.musicStarted = false;
    this.recorder = null;
    this.captureDownloadKey = null;
    this.captureDownloadInProgress = false;
    this.hasDownloadedCapture = false;
    this.actionHistory = [];
    this.recordingStartTime = 0;
    this.shadowReplays = [];
    this.playerTurn = INITIAL_PLAYER;
    this.loadedRunCountForGame = 0;
    this.loadedRunMaxNumberForGame = 0;
    this.hasTriggeredPulsarShadowSequence = false;
    this.storySequenceLocked = false;
    this.storySequenceTimer = null;
    this.documentPosition = null;
    this.documentPickup = null;
    this.hasSpawnedDocument = false;
    this.hasReachedDocument = false;
    this.movementLocked = false;
    this.hasTriggeredTurnEndSequence = false;
    this.actionKey = null;
    this.hangmanActive = false;
    this.phraseGuessSlots = [];
    this.hangmanWon = false;
    this.isEvaluatingPhrase = false;
    this.hangmanDisplayText = null;
    this.flowerGraphics = null;
    this.hasReleasedAlphabet = false;
    this.letterTiles = null;
    this.flowerReadyTime = 0;
    this.alphabetReleasedTime = 0;
    this.showingFlowerProximityMessage = false;
    this.hasSeenFlowerReadyWhisper = false;
    this.flowerRelaxRevealActive = false;
    this.flowerMemoryRevealActive = false;
    this.playerWasAirborne = false;
    this.lastLandingTile = null;
  }

  create() {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "wall").setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.storyText = this.add
      .text(
        GAME_WIDTH / 2,
        80,
        "",
        {
          fontFamily: "Georgia, Times New Roman, serif",
          fontStyle: "italic",
          fontSize: "52px",
          color: "#ffffff",
          align: "center",
          lineSpacing: 10,
          stroke: "#6a5637",
          strokeThickness: 8,
          wordWrap: {
            width: STORY_TEXT_WRAP_VISUAL_WIDTH / STORY_TEXT_SCALE,
            useAdvancedWrap: true,
          },
        },
      )
      .setOrigin(0.5, 0)
      .setScale(STORY_TEXT_SCALE);
    this.storyText.setVisible(false);

    const sky = this.add.image(PLAY_AREA.x + PLAY_AREA.width / 2, PLAY_AREA.y + PLAY_AREA.height / 2, "sky");
    const skyScale = Math.max(PLAY_AREA.width / sky.width, PLAY_AREA.height / sky.height);
    sky.setScale(skyScale);

    // Keep sky image aspect ratio while clipping overflow to arena.
    const skyMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
    skyMaskShape.fillRect(PLAY_AREA.x, PLAY_AREA.y, PLAY_AREA.width, PLAY_AREA.height);
    sky.setMask(skyMaskShape.createGeometryMask());

    this.add.rectangle(PLAY_AREA.x + PLAY_AREA.width / 2, PLAY_AREA.y + PLAY_AREA.height - 2, PLAY_AREA.width, 4, 0x3cae3f);
    this.add.rectangle(PLAY_AREA.x + PLAY_AREA.width / 2, PLAY_AREA.y + PLAY_AREA.height - 6, PLAY_AREA.width, 2, 0x2f8f34, 0.5);

    const flowerData = this.drawLeftFlower();
    this.flowerPosition = flowerData.position;
    this.flowerGraphics = flowerData.graphics;

    this.ground = this.add.rectangle(
      PLAY_AREA.x + PLAY_AREA.width / 2,
      PLAY_AREA.y + PLAY_AREA.height - 3,
      PLAY_AREA.width,
      6,
      0x000000,
      0,
    );
    this.physics.add.existing(this.ground, true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.captureDownloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.initRecording();
    this.loadPastRunReplays().finally(() => {
      this.createPlayer();
      this.resetActionRecording();
      this.initHangmanState();
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

    if (typeof window.hideBootLoader === "function") {
      window.hideBootLoader();
    }
  }

  drawLeftFlower() {
    const x = PLAY_AREA.x + 18;
    const y = PLAY_AREA.y + PLAY_AREA.height - 18;

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

  update() {
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

      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && body.blocked.down) {
        body.setVelocityY(-this.jumpSpeed);
        this.triggerStoryEvent("first-jump");
      }
      if (this.captureDownloadKey && Phaser.Input.Keyboard.JustDown(this.captureDownloadKey)) {
        this.endTurn();
      }
    }

    const halfW = body.width / 2;

    this.player.x = Phaser.Math.Clamp(this.player.x, PLAY_AREA.x + halfW, PLAY_AREA.x + PLAY_AREA.width - halfW);
    this.recordPlayerFrame();
    this.updateShadowReplays();
    this.updateFlowerProximityMessages();
    this.updateHangman();
  }

  isAnyoneMoving() {
    if (this.player?.body) {
      const body = this.player.body;
      const playerIsMoving =
        Math.abs(body.velocity.x) > 10 || Math.abs(body.velocity.y) > 10 || !body.blocked.down;
      if (playerIsMoving) return true;
    }

    return this.shadowReplays.some((replay) => replay.sprite?.active && !replay.isComplete);
  }

  isPlayerNearFlower() {
    if (!this.flowerPosition || !this.player?.active) return false;
    return (
      Phaser.Math.Distance.Between(this.player.x, this.player.y, this.flowerPosition.x, this.flowerPosition.y) <
      FLOWER_BUTTON_DISTANCE
    );
  }

  isHiikeGhostFinished() {
    const hiikeReplay = this.shadowReplays.find(
      (replay) => this.normalizePlayerTurn(replay.playerTurn) === "hiike" && replay.sprite?.active,
    );
    if (!hiikeReplay) return true;
    return hiikeReplay.isComplete;
  }

  canInteractWithFlower() {
    return this.isHiikeGhostFinished() && !this.isAnyoneMoving();
  }

  markFlowerReadyIfNeeded() {
    if (this.hasReleasedAlphabet || this.flowerReadyTime > 0) return;
    if (this.canInteractWithFlower()) {
      this.flowerReadyTime = this.time.now;
    }
  }

  isFlowerBoredMessageAvailable() {
    return this.flowerReadyTime > 0 && this.time.now - this.flowerReadyTime >= FLOWER_BORED_DELAY_MS;
  }

  isPostAlphabetMemoryAvailable() {
    if (!this.hasReleasedAlphabet || !this.alphabetReleasedTime) return false;
    return this.time.now - this.alphabetReleasedTime >= FLOWER_MEMORY_DELAY_MS;
  }

  showFlowerProximityMessage(text) {
    this.showingFlowerProximityMessage = true;
    this.showStoryText(text, { autoHideMs: 0, force: true });
  }

  hideFlowerProximityMessage() {
    if (!this.showingFlowerProximityMessage) return;
    this.showingFlowerProximityMessage = false;
    this.hideStoryText();
  }

  updateFlowerProximityMessages() {
    if (!this.flowerPosition || !this.player?.active) return;

    this.markFlowerReadyIfNeeded();
    const nearFlower = this.isPlayerNearFlower();

    if (this.hasReleasedAlphabet) {
      if (nearFlower && this.flowerMemoryRevealActive && this.isPostAlphabetMemoryAvailable()) {
        this.showFlowerProximityMessage(FLOWER_MEMORY_LINE);
      } else if (nearFlower && this.flowerRelaxRevealActive && !this.isPostAlphabetMemoryAvailable()) {
        this.showFlowerProximityMessage(FLOWER_RELAX_LINE);
      } else {
        this.hideFlowerProximityMessage();
      }
      return;
    }

    if (!nearFlower) {
      this.hideFlowerProximityMessage();
      return;
    }

    if (!this.canInteractWithFlower()) {
      if (!this.hasSeenFlowerReadyWhisper) {
        this.showFlowerProximityMessage(FLOWER_MOVEMENT_LINE);
      }
      return;
    }

    this.hasSeenFlowerReadyWhisper = true;
    if (this.isFlowerBoredMessageAvailable()) {
      this.showFlowerProximityMessage(FLOWER_BORED_LINE);
    } else {
      this.showFlowerProximityMessage(FLOWER_WHISPER_LINE);
    }
  }

  updateStoryTriggers() {
    if (this.hasSpawnedDocument && !this.hasReachedDocument && this.documentPosition) {
      const distanceToDocument = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.documentPosition.x,
        this.documentPosition.y,
      );
      if (distanceToDocument < DOCUMENT_PICKUP_DISTANCE) {
        this.triggerStoryEvent("reach-document");
      }
    }
  }

  triggerStoryEvent(eventName) {
    if (this.storySequenceLocked) return;
    if (eventName === "first-jump" && this.storyEventsFired.has("first-jump")) return;
    if (eventName === "reach-flower" || eventName === "leave-flower" || eventName === "first-jump") {
      this.storyEventsFired.add(eventName);
      return;
    }

    if (eventName === "reach-document" && !this.hasReachedDocument) {
      this.hasReachedDocument = true;
      this.documentPickup?.destroy();
      this.documentPickup = null;
      this.endTurn();
    }
  }

  showStoryText(text, options = {}) {
    const { autoHideMs = 0, force = false, speaker = null } = options;
    if (this.storySequenceLocked && !force) return;

    if (this.storyHideTimer) {
      this.storyHideTimer.remove(false);
      this.storyHideTimer = null;
    }

    const formattedText = this.formatStoryText(text);
    this.storyText.setWordWrapWidth(this.getStoryTextWrapWidth(), true);
    this.storyText.setColor(this.getStoryTextColor(speaker));
    this.storyText.setText(formattedText);
    this.storyText.setVisible(true);

    if (autoHideMs > 0) {
      this.storyHideTimer = this.time.delayedCall(autoHideMs, () => {
        // Keep the flower text visible if the player is currently next to it.
        if (!this.wasNearFlower) {
          this.hideStoryText();
        }
      });
    }
  }

  current_player_says(text, options = {}) {
    const { autoHideMs = STORY_TEXT_DEFAULT_AUTO_HIDE_MS, ...restOptions } = options;
    this.showStoryText(text, {
      ...restOptions,
      autoHideMs,
      speaker: this.playerTurn,
    });
  }

  other_player_says(text, options = {}) {
    const { autoHideMs = STORY_TEXT_DEFAULT_AUTO_HIDE_MS, ...restOptions } = options;
    this.showStoryText(text, {
      ...restOptions,
      autoHideMs,
      speaker: this.getOppositePlayerTurn(this.playerTurn),
    });
  }

  hideStoryText() {
    if (this.storyHideTimer) {
      this.storyHideTimer.remove(false);
      this.storyHideTimer = null;
    }
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

  createPlayer() {
    if (this.player?.active) return;

    const playerStyle = this.getCharacterStyle(this.playerTurn);
    this.player = this.physics.add
      .sprite(PLAY_AREA.x + 95, PLAY_AREA.y + PLAY_AREA.height - 22, playerStyle.textureKey)
      .setScale(1.4);
    this.player.setDepth(5);
    this.player.setAlpha(1);
    this.player.body.setAllowGravity(true);
    this.player.body.setCollideWorldBounds(false);
    this.player.body.setSize(this.player.width * 0.55, this.player.height * 0.82);
    this.player.body.setOffset(this.player.width * 0.2, this.player.height * 0.18);
    this.player.body.setGravityY(950);
    this.physics.add.collider(this.player, this.ground);
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

    this.actionHistory.push({
      time: this.time.now - this.recordingStartTime,
      x: this.player.x,
      y: this.player.y,
      flipX: this.player.flipX,
    });
  }

  startShadowReplay(frames, playerTurn = INITIAL_PLAYER) {
    if (!Array.isArray(frames) || frames.length < 2) return;

    const firstFrame = frames[0];
    const style = this.getCharacterStyle(playerTurn);
    const shadow = this.add
      .sprite(firstFrame.x, firstFrame.y, style.textureKey)
      .setScale(1.4)
      .setDepth(4);
    shadow.setTint(style.shadowTint);
    shadow.setAlpha(style.shadowAlpha);
    shadow.setFlipX(firstFrame.flipX);

    this.shadowReplays.push({
      sprite: shadow,
      frames,
      playerTurn: this.normalizePlayerTurn(playerTurn),
      startTime: this.time.now,
      frameIndex: 0,
      isComplete: false,
    });
  }

  async loadPastRunReplays() {
    const runFilePaths = await this.discoverPastRunFiles();
    const pastRunsData = await this.loadPastRunsData(runFilePaths);
    this.applyPastRunsSnapshot(pastRunsData);
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
      this.startShadowReplay(runData.replayFrames, runData.replayPlayerTurn);
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
      .map((frame) => ({
        time: frame.time,
        x: frame.x,
        y: frame.y,
        flipX: frame.flipX,
      }))
      .sort((a, b) => a.time - b.time);
  }

  getNextRunNumber() {
    return Math.max(this.loadedRunMaxNumberForGame, this.loadedRunCountForGame) + 1;
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
    if (this.captureDownloadInProgress) return;
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

    this.startTurnEndSequence();
    this.captureDownloadInProgress = true;

    this.createCaptureZip()
      .then(() => {
        this.hasDownloadedCapture = true;
      })
      .catch((error) => {
        console.warn("Unable to save recording:", error);
        if (announce) {
          this.showStoryText("Could not save recording.", { autoHideMs: 1600 });
        }
      })
      .finally(() => {
        this.captureDownloadInProgress = false;
        this.recorder = null;
      });
  }

  startTurnEndSequence() {
    if (this.hasTriggeredTurnEndSequence) return;
    this.hasTriggeredTurnEndSequence = true;
    this.cameras.main.flash(500, 255, 255, 255, true);
    this.time.delayedCall(500, () => this.lockMovement());
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
    if (this.storySequenceTimer) {
      this.storySequenceTimer.remove(false);
      this.storySequenceTimer = null;
    }
    this.documentPickup?.destroy();
    this.documentPickup = null;
    this.cleanupHangman();
    for (const replay of this.shadowReplays) {
      replay.sprite?.destroy();
    }
    this.shadowReplays = [];
  }

  initHangmanState() {
    if (this.hangmanActive) return;
    this.hangmanActive = true;
    this.phraseGuessSlots = this.createEmptyPhraseSlots();
    this.hangmanWon = false;
    this.isEvaluatingPhrase = false;
    this.hangmanDisplayText = null;

    this.letterTiles = this.add.group();
    this.letterTileColliderAdded = false;
    this.playerWasAirborne = false;
    this.lastLandingTile = null;
  }

  revealHangmanPhrase() {
    if (this.hangmanDisplayText?.active) return;

    this.hangmanDisplayText = this.add
      .text(PLAY_AREA.x + PLAY_AREA.width / 2, PLAY_AREA.y + 18, this.getHangmanBlankDisplay(), {
        fontFamily: "Georgia, Times New Roman, serif",
        fontSize: "34px",
        color: "#fff4c8",
        align: "center",
        letterSpacing: 8,
        stroke: "#4a3a24",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0)
      .setDepth(8);
  }

  animateFlowerPress() {
    if (!this.flowerGraphics?.active) return;
    this.tweens.add({
      targets: this.flowerGraphics,
      scaleY: 0.88,
      duration: 120,
      yoyo: true,
      ease: "Quad.Out",
    });
  }

  releaseAlphabetFromFlower() {
    if (!this.hangmanActive || this.hangmanWon || this.hasReleasedAlphabet) return;
    this.hasReleasedAlphabet = true;
    this.alphabetReleasedTime = this.time.now;
    this.hideFlowerProximityMessage();
    this.animateFlowerPress();
    this.revealHangmanPhrase();

    const letters = HANGMAN_ALPHABET.split("");

    letters.forEach((letterChar, index) => {
      this.time.delayedCall(index * 55, () => this.spawnLetterTile(letterChar, index));
    });
  }

  createEmptyPhraseSlots() {
    return HANGMAN_PHRASE_SLOTS.map((slot) => (slot === " " ? " " : "-"));
  }

  getHangmanBlankDisplay() {
    return this.formatPhraseSlots(this.createEmptyPhraseSlots());
  }

  formatPhraseSlots(slots) {
    let wordIndex = 0;
    return HANGMAN_WORDS.map((word) => {
      const segment = slots.slice(wordIndex, wordIndex + word.length).join("");
      wordIndex += word.length + 1;
      return segment;
    }).join(" ");
  }

  getPhraseGuessString() {
    return this.formatPhraseSlots(this.phraseGuessSlots);
  }

  updateHangmanDisplay() {
    if (!this.hangmanDisplayText?.active) return;
    this.hangmanDisplayText.setText(this.getPhraseGuessString());
  }

  addLetterToPhraseGuess(letterChar) {
    const letter = typeof letterChar === "string" ? letterChar.toUpperCase() : "";
    if (!letter) return false;

    for (let index = 0; index < this.phraseGuessSlots.length; index += 1) {
      if (this.phraseGuessSlots[index] === "-") {
        this.phraseGuessSlots[index] = letter;
        this.updateHangmanDisplay();
        return true;
      }
    }

    return false;
  }

  isPhraseGuessComplete() {
    return this.phraseGuessSlots.every((slot) => slot !== "-");
  }

  playHangmanBuzzSound() {
    const audioContext = this.sound?.context;
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }

    if (audioContext && this.sound?.masterVolumeNode) {
      const startTime = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(90, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(55, startTime + 0.35);
      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      oscillator.connect(gain);
      gain.connect(this.sound.masterVolumeNode);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    }

    if (this.cache.audio.exists("sad")) {
      this.sound.play("sad", { volume: 0.48, detune: -700 });
    }
  }

  playHangmanSuccessSound() {
    if (this.cache.audio.exists("light")) {
      this.sound.play("light", { volume: 0.45 });
    }
  }

  resetHangmanAttempt() {
    this.phraseGuessSlots = this.createEmptyPhraseSlots();
    this.lastLandingTile = null;
    this.isEvaluatingPhrase = false;

    if (this.hangmanDisplayText?.active) {
      this.hangmanDisplayText.setText(this.getHangmanBlankDisplay());
    }

    if (!this.letterTiles) return;

    this.letterTiles.children.each((tilePlatform) => {
      tilePlatform.hasBeenStomped = false;
      return true;
    });
  }

  evaluatePhraseAfterAllLettersTried() {
    if (this.hangmanWon || this.isEvaluatingPhrase || !this.isPhraseGuessComplete()) return;
    this.isEvaluatingPhrase = true;

    const guess = this.getPhraseGuessString();
    if (guess === HANGMAN_SECRET) {
      this.hangmanWon = true;
      this.playHangmanSuccessSound();
      this.cameras.main.flash(280, 255, 244, 180, true);
      return;
    }

    this.playHangmanBuzzSound();
    this.resetHangmanAttempt();
  }

  getLetterTileSlot(index) {
    const col = index % LETTER_TILE_COLS;
    const row = Math.floor(index / LETTER_TILE_COLS);
    const pitch = LETTER_TILE_SIZE + LETTER_TILE_GAP;
    const gridWidth = LETTER_TILE_COLS * pitch - LETTER_TILE_GAP;
    const startX = PLAY_AREA.x + (PLAY_AREA.width - gridWidth) / 2 + LETTER_TILE_SIZE / 2;
    const groundSurfaceY = PLAY_AREA.y + PLAY_AREA.height - 6;
    const groundRowCenterY = groundSurfaceY + LETTER_TILE_SIZE / 2;
    const rowStep = LETTER_TILE_SIZE + LETTER_TILE_ROW_GAP;

    return {
      x: startX + col * pitch,
      y: groundRowCenterY - row * rowStep,
      row,
    };
  }

  spawnLetterTile(letterChar, index) {
    if (!this.hangmanActive || this.hangmanWon || !this.letterTiles) return;
    if (typeof letterChar !== "string") return;

    const char = letterChar.toUpperCase();
    const slot = this.getLetterTileSlot(index);
    const spawnY = PLAY_AREA.y - 36;

    const tilePlatform = this.add
      .rectangle(slot.x, spawnY, LETTER_TILE_SIZE, LETTER_TILE_SIZE, 0x5d4e34, 0.96)
      .setStrokeStyle(2, 0xd4bc7a)
      .setDepth(6);
    const tileLabel = this.add
      .text(slot.x, spawnY, char, {
        fontFamily: "Arial, sans-serif",
        fontSize: `${LETTER_TILE_FONT_SIZE}px`,
        color: "#fff8dc",
        stroke: "#2a2115",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(7);

    tilePlatform.letterChar = char;
    tilePlatform.hasBeenStomped = false;
    tilePlatform.isLanded = false;
    tilePlatform.slotX = slot.x;
    tilePlatform.slotY = slot.y;
    tilePlatform.tileLabel = tileLabel;

    this.letterTiles.add(tilePlatform);

    this.tweens.add({
      targets: [tilePlatform, tileLabel],
      y: slot.y,
      duration: 460 + index * 22,
      ease: "Bounce.Out",
      onComplete: () => this.enableLetterTilePlatform(tilePlatform),
    });
  }

  enableLetterTilePlatform(tilePlatform) {
    if (!tilePlatform?.active) return;
    tilePlatform.isLanded = true;
    tilePlatform.x = tilePlatform.slotX;
    tilePlatform.y = tilePlatform.slotY;
    if (tilePlatform.tileLabel?.active) {
      tilePlatform.tileLabel.x = tilePlatform.slotX;
      tilePlatform.tileLabel.y = tilePlatform.slotY;
    }

    this.physics.add.existing(tilePlatform, true);
    tilePlatform.body.setSize(LETTER_TILE_SIZE, LETTER_TILE_SIZE, true);

    if (!this.letterTileColliderAdded) {
      this.physics.add.collider(this.player, this.letterTiles);
      this.physics.add.collider(this.letterTiles, this.letterTiles);
      this.letterTileColliderAdded = true;
    }
  }

  getTileUnderPlayer() {
    if (!this.player?.body || !this.letterTiles) return null;

    let landedTile = null;
    this.letterTiles.children.each((tilePlatform) => {
      if (!tilePlatform?.active || !tilePlatform.isLanded) return true;
      if (!this.isPlayerOnTile(tilePlatform)) return true;
      landedTile = tilePlatform;
      return false;
    });

    return landedTile;
  }

  isPlayerOnTile(tilePlatform) {
    if (!this.player?.body || !tilePlatform?.active || !tilePlatform.isLanded) return false;

    const half = LETTER_TILE_SIZE / 2;
    const tileTop = tilePlatform.y - half;
    const feetX = this.player.x;
    const feetY = this.player.body.bottom;
    const onTileX = Math.abs(feetX - tilePlatform.x) <= half + 6;
    const onTileY = feetY >= tileTop - 10 && feetY <= tileTop + 14;
    return onTileX && onTileY;
  }

  checkPlayerLetterLanding() {
    if (!this.hangmanActive || this.hangmanWon || !this.player?.body) return;

    const body = this.player.body;
    const isAirborne = !body.blocked.down;
    const justLanded = body.blocked.down && this.playerWasAirborne;
    this.playerWasAirborne = isAirborne;

    if (!justLanded) return;

    const tileUnderPlayer = this.getTileUnderPlayer();
    if (!tileUnderPlayer || tileUnderPlayer === this.lastLandingTile) return;

    this.lastLandingTile = tileUnderPlayer;
    this.activateLetterFromLanding(tileUnderPlayer);
  }

  activateLetterFromLanding(tilePlatform) {
    if (!tilePlatform?.active || !tilePlatform.isLanded || !this.hasReleasedAlphabet || this.hangmanWon) return;

    const letterAdded = this.addLetterToPhraseGuess(tilePlatform.letterChar);
    if (!letterAdded) return;

    if (!this.isPhraseGuessComplete()) return;

    this.time.delayedCall(80, () => this.evaluatePhraseAfterAllLettersTried());
  }

  updateHangman() {
    if (!this.hangmanActive || !this.flowerPosition) return;

    const distanceToFlower = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.flowerPosition.x,
      this.flowerPosition.y,
    );
    const nearFlower = distanceToFlower < FLOWER_BUTTON_DISTANCE;

    if (this.actionKey && Phaser.Input.Keyboard.JustDown(this.actionKey) && nearFlower && !this.hangmanWon) {
      if (this.hasReleasedAlphabet) {
        if (this.isPostAlphabetMemoryAvailable()) {
          this.flowerRelaxRevealActive = false;
          this.flowerMemoryRevealActive = true;
        } else {
          this.flowerRelaxRevealActive = true;
        }
        return;
      }

      if (this.canInteractWithFlower()) {
        this.releaseAlphabetFromFlower();
      }
    }

    if (!this.player?.body?.blocked.down) {
      this.lastLandingTile = null;
    }
    this.checkPlayerLetterLanding();
  }

  cleanupHangman() {
    this.hangmanDisplayText?.destroy();
    this.hangmanDisplayText = null;
    if (this.letterTiles) {
      this.letterTiles.children.each((tilePlatform) => {
        tilePlatform.tileLabel?.destroy();
        return true;
      });
      this.letterTiles.clear(true, true);
      this.letterTiles = null;
    }
    this.hasReleasedAlphabet = false;
    this.flowerReadyTime = 0;
    this.alphabetReleasedTime = 0;
    this.showingFlowerProximityMessage = false;
    this.hasSeenFlowerReadyWhisper = false;
    this.flowerRelaxRevealActive = false;
    this.flowerMemoryRevealActive = false;
    this.letterTileColliderAdded = false;
    this.playerWasAirborne = false;
    this.lastLandingTile = null;
    this.phraseGuessSlots = [];
    this.isEvaluatingPhrase = false;
    this.hangmanActive = false;
  }

  spawnDocumentPickup() {
    if (this.hasSpawnedDocument || !this.flowerPosition) return;
    const x = Phaser.Math.Clamp(this.flowerPosition.x + 72, PLAY_AREA.x + 20, PLAY_AREA.x + PLAY_AREA.width - 20);
    const y = this.flowerPosition.y - 1;

    const documentPickup = this.add.graphics();
    documentPickup.fillStyle(0xf6eac6, 1);
    documentPickup.lineStyle(2, 0x8e7a52, 1);
    documentPickup.fillRoundedRect(x - 10, y - 14, 20, 26, 2);
    documentPickup.strokeRoundedRect(x - 10, y - 14, 20, 26, 2);
    documentPickup.lineStyle(1, 0x8e7a52, 0.95);
    documentPickup.lineBetween(x - 5, y - 6, x + 5, y - 6);
    documentPickup.lineBetween(x - 5, y - 1, x + 5, y - 1);
    documentPickup.lineBetween(x - 5, y + 4, x + 2, y + 4);
    documentPickup.fillStyle(0xfff6de, 1);
    documentPickup.fillTriangle(x + 10, y - 14, x + 5, y - 14, x + 10, y - 9);
    documentPickup.setDepth(3);

    this.tweens.add({
      targets: documentPickup,
      y: "-=3",
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.InOut",
    });

    this.documentPickup = documentPickup;
    this.documentPosition = { x, y };
    this.hasSpawnedDocument = true;
  }

  formatStoryText(rawText) {
    if (typeof rawText !== "string") return rawText;
    return rawText.replace(/_([^_]+)_/g, (_match, groupText) => this.toItalicUnicode(groupText));
  }

  toItalicUnicode(value) {
    if (typeof value !== "string") return value;
    return Array.from(value)
      .map((char) => {
        const code = char.codePointAt(0);
        if (code >= 65 && code <= 90) {
          return String.fromCodePoint(0x1d434 + (code - 65));
        }
        if (code >= 97 && code <= 122) {
          if (code === 104) return String.fromCodePoint(0x210e); // Lowercase italic h has a dedicated codepoint.
          return String.fromCodePoint(0x1d44e + (code - 97));
        }
        return char;
      })
      .join("");
  }

  getStoryTextWrapWidth() {
    const effectiveScaleX = Math.max(Math.abs(this.storyText?.scaleX ?? STORY_TEXT_SCALE), 0.001);
    return STORY_TEXT_WRAP_VISUAL_WIDTH / effectiveScaleX;
  }

  getStoryTextColor(speaker) {
    const speakerToColor = typeof speaker === "string" && speaker.trim() ? speaker : this.playerTurn;
    const style = CHARACTER_STYLES[this.normalizePlayerTurn(speakerToColor)];
    return style?.textColor ?? STORY_TEXT_DEFAULT_COLOR;
  }

  playStorySequence(lines, lineDurationMs, onComplete, options = {}) {
    if (!Array.isArray(lines) || lines.length === 0) {
      onComplete?.();
      return;
    }
    if (this.storySequenceTimer) {
      this.storySequenceTimer.remove(false);
      this.storySequenceTimer = null;
    }

    let index = 0;
    const showLine = () => {
      this.showStoryText(lines[index], { force: true, speaker: options.speaker ?? null });
      index += 1;
      if (index >= lines.length) {
        this.storySequenceTimer = this.time.delayedCall(lineDurationMs, () => {
          this.storySequenceTimer = null;
          onComplete?.();
        });
        return;
      }

      this.storySequenceTimer = this.time.delayedCall(lineDurationMs, showLine);
    };

    showLine();
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
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.NONE,
  },
};

new Phaser.Game(config);
