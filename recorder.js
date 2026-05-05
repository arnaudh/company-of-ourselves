class GameRecorder {
  constructor(options = {}) {
    if (!options.canvas) {
      throw new Error("GameRecorder requires a canvas.");
    }

    this.canvas = options.canvas;
    this.audioContext = options.audioContext || null;
    this.audioNode = options.audioNode || null;
    this.filenamePrefix = options.filenamePrefix || "game-recording";
    this.fps = options.fps || 60;
    this.videoBitsPerSecond = options.videoBitsPerSecond || 2_000_000;
    this.audioBitsPerSecond = options.audioBitsPerSecond || 128_000;
    this.mimeTypes = options.mimeTypes || [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    this.combinedStream = null;
    this.audioDestination = null;
    this.recorder = null;
    this.chunks = [];
    this.selectedMimeType = "";
    this.isStarted = false;
    this.didDownload = false;
  }

  isSupported() {
    return typeof MediaRecorder !== "undefined" && typeof this.canvas.captureStream === "function";
  }

  start() {
    if (this.isStarted) return;
    if (!this.isSupported()) {
      throw new Error("Recording is not supported in this browser.");
    }

    const videoStream = this.canvas.captureStream(this.fps);
    this.combinedStream = new MediaStream(videoStream.getVideoTracks());
    this._attachAudioTrack();

    this.selectedMimeType = this._pickMimeType();
    this.recorder = new MediaRecorder(this.combinedStream, {
      mimeType: this.selectedMimeType,
      videoBitsPerSecond: this.videoBitsPerSecond,
      audioBitsPerSecond: this.audioBitsPerSecond,
    });

    this.chunks = [];
    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    });

    this.recorder.start();
    this.isStarted = true;
  }

  async stopAndDownload() {
    const recording = await this.stopAndGetBlob();
    this.didDownload = true;
    this._downloadBlob(recording.blob, recording.filename);
  }

  async stopAndGetBlob() {
    if (!this.recorder || this.recorder.state === "inactive") {
      throw new Error("Recording is not active.");
    }

    const blob = await new Promise((resolve, reject) => {
      this.recorder.addEventListener(
        "stop",
        () => {
          try {
            resolve(new Blob(this.chunks, { type: this.selectedMimeType || "video/webm" }));
          } catch (error) {
            reject(error);
          }
        },
        { once: true },
      );

      this.recorder.addEventListener(
        "error",
        (event) => {
          reject(event.error || new Error("Recording failed."));
        },
        { once: true },
      );

      this.recorder.stop();
    });

    const filename = this._buildVideoFilename();
    this.dispose();
    return { blob, filename };
  }

  dispose() {
    if (this.audioNode && this.audioDestination) {
      try {
        this.audioNode.disconnect(this.audioDestination);
      } catch (error) {
        // Ignore disconnect errors when node graph changed in the engine.
      }
    }

    if (this.combinedStream) {
      this.combinedStream.getTracks().forEach((track) => track.stop());
    }

    this.recorder = null;
    this.combinedStream = null;
    this.audioDestination = null;
    this.chunks = [];
    this.isStarted = false;
  }

  _attachAudioTrack() {
    if (!this.audioContext || !this.audioNode) return;

    this.audioDestination = this.audioContext.createMediaStreamDestination();
    this.audioNode.connect(this.audioDestination);

    const audioTracks = this.audioDestination.stream.getAudioTracks();
    audioTracks.forEach((track) => this.combinedStream.addTrack(track));
  }

  _pickMimeType() {
    for (const type of this.mimeTypes) {
      if (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "video/webm";
  }

  _downloadBlob(blob, filename = this._buildVideoFilename()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  _buildVideoFilename() {
    const extension = this.selectedMimeType.includes("webm") ? "webm" : "video";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${this.filenamePrefix}-${timestamp}.${extension}`;
  }
}

window.GameRecorder = GameRecorder;
