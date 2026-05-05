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
const PLAYER_TURN = "pulsar";
const CHARACTER_STYLES = {
  pulsar: {
    textureKey: "pulsar",
    shadowTint: 0x555555,
    shadowAlpha: 0.45,
  },
  hiike: {
    textureKey: "hiike",
    shadowTint: 0xc8c8c8,
    shadowAlpha: 0.72,
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
    this.musicQueue = ["sad", "sad", "sad", "light", "light", "light"];
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
    this.playerTurn = PLAYER_TURN;
    this.loadedRunCountForGame = 0;
    this.loadedRunMaxNumberForGame = 0;
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
        },
      )
      .setOrigin(0.5, 0)
      .setScale(0.5);
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

    this.flowerPosition = this.drawLeftFlower();

    this.ground = this.add.rectangle(
      PLAY_AREA.x + PLAY_AREA.width / 2,
      PLAY_AREA.y + PLAY_AREA.height - 3,
      PLAY_AREA.width,
      6,
      0x000000,
      0,
    );
    this.physics.add.existing(this.ground, true);

    const playerStyle = this.getCharacterStyle(this.playerTurn);
    this.player = this.physics.add
      .sprite(PLAY_AREA.x + 95, PLAY_AREA.y + PLAY_AREA.height - 22, playerStyle.textureKey)
      .setScale(1.4);
    this.player.setDepth(5);
    this.applyCharacterStyle(this.player, this.playerTurn, false);
    this.player.body.setAllowGravity(true);
    this.player.body.setCollideWorldBounds(false);
    this.player.body.setSize(this.player.width * 0.55, this.player.height * 0.82);
    this.player.body.setOffset(this.player.width * 0.2, this.player.height * 0.18);
    this.player.body.setGravityY(950);

    this.physics.add.collider(this.player, this.ground);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.captureDownloadKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.resetActionRecording();
    this.initRecording();
    this.loadPastRunReplays();

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

    this.showStoryText("I wake up in a painted room.\nArrow keys move me. Up jumps.", {
      autoHideMs: 2600,
    });

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

    return { x, y: y - 20 };
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
      this.triggerStoryEvent("first-jump");
    }
    if (this.captureDownloadKey && Phaser.Input.Keyboard.JustDown(this.captureDownloadKey)) {
      this.downloadCapture();
    }

    const halfW = body.width / 2;

    this.player.x = Phaser.Math.Clamp(this.player.x, PLAY_AREA.x + halfW, PLAY_AREA.x + PLAY_AREA.width - halfW);
    this.recordPlayerFrame();
    this.updateShadowReplays();
    this.updateStoryTriggers();
  }

  updateStoryTriggers() {
    if (!this.flowerPosition) return;

    const distanceToFlower = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.flowerPosition.x,
      this.flowerPosition.y,
    );
    const nearFlower = distanceToFlower < 34;

    if (nearFlower && !this.wasNearFlower) {
      this.triggerStoryEvent("reach-flower");
      this.hasReachedFlower = true;
    } else if (!nearFlower && this.wasNearFlower) {
      this.triggerStoryEvent("leave-flower");
    }

    this.wasNearFlower = nearFlower;
  }

  triggerStoryEvent(eventName) {
    if (eventName === "first-jump" && this.storyEventsFired.has("first-jump")) return;
    if (eventName === "reach-flower") {
      this.showStoryText("A tiny flower waits at the edge.\nI think it understands me.");
      this.storyEventsFired.add("reach-flower");
      return;
    }

    if (eventName === "leave-flower") {
      this.showStoryText("I step away, and the feeling fades.", { autoHideMs: 1800 });
      return;
    }

    if (eventName === "first-jump") {
      this.showStoryText("I test gravity with a hopeful jump.", { autoHideMs: 1200 });
      this.storyEventsFired.add("first-jump");
    }
  }

  showStoryText(text, options = {}) {
    const { autoHideMs = 0 } = options;

    if (this.storyHideTimer) {
      this.storyHideTimer.remove(false);
      this.storyHideTimer = null;
    }

    this.storyText.setText(text);
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

  hideStoryText() {
    if (this.storyHideTimer) {
      this.storyHideTimer.remove(false);
      this.storyHideTimer = null;
    }
    this.storyText.setVisible(false);
  }

  normalizePlayerTurn(rawPlayerTurn) {
    if (typeof rawPlayerTurn !== "string") return PLAYER_TURN;
    const normalized = rawPlayerTurn.trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(CHARACTER_STYLES, normalized) ? normalized : PLAYER_TURN;
  }

  getCharacterStyle(playerTurn) {
    const normalizedTurn = this.normalizePlayerTurn(playerTurn);
    return CHARACTER_STYLES[normalizedTurn] ?? CHARACTER_STYLES[PLAYER_TURN];
  }

  applyCharacterStyle(sprite, playerTurn, isShadow) {
    if (!sprite) return;
    const style = this.getCharacterStyle(playerTurn);
    sprite.clearTint();
    if (isShadow) {
      sprite.setTint(style.shadowTint);
      sprite.setAlpha(style.shadowAlpha);
      return;
    }
    sprite.setAlpha(1);
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

  startShadowReplay(frames, playerTurn = PLAYER_TURN) {
    if (!Array.isArray(frames) || frames.length < 2) return;

    const firstFrame = frames[0];
    const style = this.getCharacterStyle(playerTurn);
    const shadow = this.add
      .sprite(firstFrame.x, firstFrame.y, style.textureKey)
      .setScale(1.4)
      .setDepth(4);
    this.applyCharacterStyle(shadow, playerTurn, true);
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
    for (const filePath of runFilePaths) {
      await this.loadRunReplay(filePath);
    }
  }

  async discoverPastRunFiles() {
    const discoveredFilePaths = new Set();

    const crawlRunDirectory = async (directoryPath) => {
      const response = await fetch(`./${directoryPath}`, { cache: "no-store" });
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

    return Array.from(discoveredFilePaths).sort();
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

  registerLoadedRun(runFilePath, runFileData) {
    const runGame = typeof runFileData?.game === "string" ? runFileData.game : GAME_ID;
    if (runGame !== GAME_ID) return;

    this.loadedRunCountForGame += 1;

    const explicitRunNumber =
      Number.isInteger(runFileData?.run_number) && runFileData.run_number > 0 ? runFileData.run_number : null;
    if (explicitRunNumber !== null) {
      this.loadedRunMaxNumberForGame = Math.max(this.loadedRunMaxNumberForGame, explicitRunNumber);
      return;
    }

    const pathMatch = runFilePath.match(/\/(\d+)\/run\.json$/);
    if (!pathMatch) return;

    const runNumberFromPath = Number.parseInt(pathMatch[1], 10);
    if (Number.isInteger(runNumberFromPath) && runNumberFromPath > 0) {
      this.loadedRunMaxNumberForGame = Math.max(this.loadedRunMaxNumberForGame, runNumberFromPath);
    }
  }

  getNextRunNumber() {
    return Math.max(this.loadedRunMaxNumberForGame, this.loadedRunCountForGame) + 1;
  }

  async loadRunReplay(fileName) {
    try {
      const response = await fetch(`./${fileName}`, {
        cache: "no-store",
      });
      if (!response.ok) return;

      const runFileData = await response.json();
      const frames = this.parseReplayFrames(runFileData);
      const replayPlayerTurn = this.normalizePlayerTurn(runFileData?.player_turn ?? runFileData?.playerTurn);

      if (frames.length < 2) return;
      this.registerLoadedRun(fileName, runFileData);
      this.startShadowReplay(frames, replayPlayerTurn);
    } catch (error) {
      // Missing or invalid run files should not block the game.
      console.warn(`Unable to load replay file "${fileName}":`, error);
    }
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

  downloadCapture() {
    if (this.captureDownloadInProgress) return;
    if (this.hasDownloadedCapture) {
      this.showStoryText("Recording already downloaded.", { autoHideMs: 1300 });
      return;
    }
    if (!this.recorder) {
      this.showStoryText("Recording unavailable in this browser.", { autoHideMs: 1500 });
      return;
    }

    this.captureDownloadInProgress = true;
    this.showStoryText("Packing recording zip...", { autoHideMs: 1200 });

    this.createCaptureZip()
      .then(() => {
        this.hasDownloadedCapture = true;
        this.showStoryText("Recording zip downloaded.", { autoHideMs: 1700 });
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

    zip.file(`${runNumber}/run.webm`, recording.blob);
    zip.file(`${runNumber}/run.json`, JSON.stringify(movementData, null, 2));
    zip.file(
      "instructions.md",
      "# Capture Notes\n\nThis is dummy content for now.\n\n- TODO: Add session summary\n- TODO: Add player metadata\n",
    );

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
      replay.sprite?.destroy();
    }
    this.shadowReplays = [];
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
