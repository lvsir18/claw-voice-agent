    const PIPELINE_ORDER = ["record", "upload", "transcribe", "transcript", "claw", "tts"];
    const PIPELINE_LABELS = {
      record: "1. 录音",
      upload: "2. 上传到服务器",
      transcribe: "3. 服务器转写",
      transcript: "4. 得到文本",
      claw: "5. 送进 OpenClaw",
      tts: "6. 回复语音",
    };
    const state = {
      session: null,
      busy: false,
      stream: null,
      mediaRecorder: null,
      mediaChunks: [],
      recording: false,
      monitorContext: null,
      monitorSource: null,
      analyser: null,
      meterTimer: null,
      micDevices: [],
      selectedDeviceId: "",
      inputLevel: 0,
      processEntries: [],
      stepState: {},
      stepStartedAt: {},
      transcriptLanguage: "zh",
      autoSend: false,
      pendingTranscript: "",
      lastUpload: null,
      localCapture: null,
      lastWakeProbe: null,
      lastTts: null,
      lastAssistantReply: "",
      clientId: "",
      currentRequestId: "",
      autoTts: true,
      ttsVoice: "zh-CN-XiaoxiaoNeural",
      ttsMode: "api",
      authToken: "",
      authenticated: false,
      wakeEnabled: true,
      wakePhrase: "你好",
      wakeSupported: false,
      wakeListening: false,
      wakeResumeTimer: null,
      wakeLastTriggerAt: 0,
      wakeRecorder: null,
      wakePending: false,
      wakeChunkBuffers: [],
      wakeChunkSamples: 0,
      wakeSamplesSinceLastCheck: 0,
      wakeChunkSampleRate: 16000,
      wakeProcessor: null,
      wakeSilentGain: null,
      currentRecordAutoSend: false,
      currentRecordWakeTriggered: false,
      speakerStatus: null,
      currentSpeakerId: localStorage.getItem("openclaw-webchat-speaker-id") || "owner",
      speakerMatchMode: localStorage.getItem("openclaw-webchat-speaker-match-mode") || "all",
      speakerEnrollRecording: false,
      speakerEnrollOpen: false,
      speakerEnrollSamples: [],
      speakerEnrollTargetSamples: 2,
      speakerEnrollLevel: 0,
      lastSpeakerScore: null,
      lastSpeakerResult: "",
      lastSpeakerReason: "",
      autoStopOnSilence: false,
      recordStartedAt: 0,
      speechSeenAt: 0,
      silenceSince: 0,
      stopRequested: false,
      wakeDebugTimer: null,
    };

    const $ = (id) => document.getElementById(id);
    const messagesEl = $("messages");
    const statusEl = $("status");
    const draftEl = $("draft");
    const sessionEl = $("sessionInput");
    const tokenInputEl = $("tokenInput");
    const authBtnEl = $("authBtn");
    const authStatusEl = $("authStatus");
    const sendBtn = $("sendBtn");
    const recordBtn = $("recordBtn");
    const uploadBtn = $("uploadBtn");
    const audioInput = $("audioInput");
    const micSelectEl = $("micSelect");
    const refreshMicsBtn = $("refreshMicsBtn");
    const inputLevelFillEl = $("inputLevelFill");
    const inputLevelTextEl = $("inputLevelText");
    const wakeToggleEl = $("wakeToggle");
    const wakePhraseInputEl = $("wakePhraseInput");
    const wakeStatusEl = $("wakeStatus");
    const speakerStatusEl = $("speakerStatus");
    const speakerSelectEl = $("speakerSelect");
    const speakerIdInputEl = $("speakerIdInput");
    const speakerSwitchBtn = $("speakerSwitchBtn");
    const speakerMatchModeSelectEl = $("speakerMatchModeSelect");
    const speakerEnrollBtn = $("speakerEnrollBtn");
    const speakerRefreshBtn = $("speakerRefreshBtn");
    const speakerEnrollModalEl = $("speakerEnrollModal");
    const speakerEnrollCloseBtn = $("speakerEnrollCloseBtn");
    const speakerEnrollCancelBtn = $("speakerEnrollCancelBtn");
    const speakerEnrollRecordBtn = $("speakerEnrollRecordBtn");
    const speakerEnrollSubmitBtn = $("speakerEnrollSubmitBtn");
    const speakerEnrollPhraseEl = $("speakerEnrollPhrase");
    const speakerEnrollProgressEl = $("speakerEnrollProgress");
    const speakerEnrollHintEl = $("speakerEnrollHint");
    const speakerEnrollLevelFillEl = $("speakerEnrollLevelFill");
    const speakerEnrollLevelTextEl = $("speakerEnrollLevelText");
    const reloadBtn = $("reloadBtn");
    const newSessionBtn = $("newSessionBtn");
    const pipelineStepsEl = $("pipelineSteps");
    const processLogEl = $("processLog");
    const languageSelectEl = $("languageSelect");
    const autoSendToggleEl = $("autoSendToggle");
    const ttsVoiceSelectEl = $("ttsVoiceSelect");
    const ttsModeSelectEl = $("ttsModeSelect");
    const autoTtsToggleEl = $("autoTtsToggle");
    const captureProofEl = $("captureProof");
    const captureProofMetaEl = $("captureProofMeta");
    const captureProofAudioEl = $("captureProofAudio");
    const uploadProofEl = $("uploadProof");
    const uploadProofMetaEl = $("uploadProofMeta");
    const uploadProofAudioEl = $("uploadProofAudio");
    const wakeProofEl = $("wakeProof");
    const wakeProofMetaEl = $("wakeProofMeta");
    const ttsProofEl = $("ttsProof");
    const ttsProofMetaEl = $("ttsProofMeta");
    const ttsProofAudioEl = $("ttsProofAudio");
    const robotCardEl = $("robotCard");
    const robotModeLabelEl = $("robotModeLabel");
    const robotModeDetailEl = $("robotModeDetail");
    const robotEyeLeftEl = $("robotEyeLeft");
    const robotEyeRightEl = $("robotEyeRight");
    const robotMouthFillEl = $("robotMouthFill");
    const robotUserBubbleEl = $("robotUserBubble");
    const robotUserBubbleTextEl = $("robotUserBubbleText");
    const robotAssistantBubbleEl = $("robotAssistantBubble");
    const robotAssistantBubbleTextEl = $("robotAssistantBubbleText");
    const sessionStore = window.sessionStorage;
    const WAKE_REARM_MS = 2500;
    const AUTO_STOP_MAX_MS = 15000;
    const AUTO_STOP_SILENCE_MS = 1200;
    const AUTO_STOP_LEVEL = 0.028;
    const WAKE_WINDOW_MS_EN = 1500;
    const WAKE_STEP_MS_EN = 500;
    const WAKE_WINDOW_MS_ZH = 3000;
    const WAKE_STEP_MS_ZH = 1000;

    function qsSession() {
      const url = new URL(window.location.href);
      return url.searchParams.get("session") || "";
    }

    function makeId(prefix) {
      const random = (globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`).replace(/[^a-zA-Z0-9-]/g, "");
      return `${prefix}-${random}`;
    }

    function setSession(session) {
      state.session = session;
      sessionEl.value = session;
      const url = new URL(window.location.href);
      url.searchParams.set("session", session);
      history.replaceState({}, "", url.toString());
      sessionStore.setItem("openclaw-webchat-session", session);
    }

    function makeSession() {
      return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function deriveRobotMode() {
      if (Object.values(state.stepState).some((step) => step?.status === "error")) return { key: "error", label: "出错了", detail: "这一步出现了问题，查看最近动作或重新试一次。" };
      if (state.recording) return { key: "listening", label: "正在聆听", detail: "我在听你说话。先看输入电平条是否有波动。" };
      if (state.wakeEnabled && state.wakeListening) return { key: "idle", label: "待唤醒", detail: `正在等待唤醒词：${state.wakePhrase}` };
      if (state.stepState.upload?.status === "active") return { key: "uploading", label: "上传中", detail: "正在把浏览器原始录音送到服务器。" };
      if (state.stepState.transcribe?.status === "active") return { key: "transcribing", label: "转写中", detail: "服务器正在把音频变成文本。" };
      if (state.stepState.claw?.status === "active") return { key: "thinking", label: "思考中", detail: "OpenClaw 正在组织回复内容。" };
      if (state.stepState.tts?.status === "active") return { key: "speaking", label: "准备开口", detail: "正在把回复转换成语音。" };
      if (state.lastTts?.url) return { key: "speaking", label: "可以播放", detail: "回复语音已经生成，可以直接播放。" };
      if (state.pendingTranscript) return { key: "heard", label: "我听到了", detail: "转写已经完成，确认文本后就可以发送。" };
      return { key: "idle", label: "待命", detail: "选择麦克风后开始录音，或直接输入文字。" };
    }

    function setBusy(busy, text = "") {
      state.busy = busy;
      const blocked = busy || !state.authenticated;
      sendBtn.disabled = blocked;
      uploadBtn.disabled = blocked;
      reloadBtn.disabled = blocked;
      speakerEnrollBtn.disabled = blocked || state.speakerEnrollRecording;
      speakerRefreshBtn.disabled = blocked || state.speakerEnrollRecording;
      speakerSwitchBtn.disabled = blocked || state.speakerEnrollRecording;
      speakerMatchModeSelectEl.disabled = blocked || state.speakerEnrollRecording;
      statusEl.textContent = text;
    }

    function withTokenUrl(raw) {
      if (!raw) return "";
      const url = new URL(raw, window.location.origin);
      if (state.authToken) url.searchParams.set("token", state.authToken);
      return url.toString();
    }

    function updateAuthUi() {
      authStatusEl.textContent = state.authenticated ? "已认证" : "未认证";
      authBtnEl.textContent = state.authenticated ? "已连接" : "连接";
      authBtnEl.disabled = state.authenticated;
      tokenInputEl.disabled = state.authenticated;
      const blocked = !state.authenticated || state.busy;
      sendBtn.disabled = blocked;
      uploadBtn.disabled = blocked;
      reloadBtn.disabled = blocked;
      newSessionBtn.disabled = !state.authenticated;
      recordBtn.disabled = !state.authenticated;
      speakerEnrollBtn.disabled = !state.authenticated || state.busy || state.speakerEnrollRecording;
      speakerRefreshBtn.disabled = !state.authenticated || state.busy || state.speakerEnrollRecording;
      speakerSwitchBtn.disabled = !state.authenticated || state.busy || state.speakerEnrollRecording;
      speakerMatchModeSelectEl.disabled = !state.authenticated || state.busy || state.speakerEnrollRecording;
    }

    function renderInputLevel() {
      const pct = Math.max(0, Math.min(100, Math.round(state.inputLevel * 100)));
      inputLevelFillEl.style.width = `${pct}%`;
      inputLevelTextEl.textContent = `${pct}%`;
    }

    function formatSpeakerScore(score) {
      if (score === null || score === undefined || score === "") return "-";
      const value = Number(score);
      return Number.isFinite(value) ? value.toFixed(2) : "-";
    }

    function updateSpeakerUi() {
      const status = state.speakerStatus || {};
      const enabledText = status.enabled ? "已开启" : "已关闭";
      const speakerId = status.speaker_id || state.currentSpeakerId || "owner";
      const matchModeText = state.speakerMatchMode === "current" ? "仅当前身份" : "所有已注册身份";
      const samples = Number.isFinite(Number(status.num_samples)) ? Number(status.num_samples) : 0;
      const profiles = Array.isArray(status.profiles) ? status.profiles : [];
      const registeredCount = profiles.filter((profile) => profile.has_profile).length;
      if (speakerSelectEl && speakerIdInputEl) {
        const selectedExists = profiles.some((profile) => profile.speaker_id === speakerId);
        speakerSelectEl.innerHTML = "";
        const selectedOption = document.createElement("option");
        selectedOption.value = speakerId;
        selectedOption.textContent = `${speakerId}${selectedExists ? "" : " (new)"}`;
        speakerSelectEl.appendChild(selectedOption);
        profiles.forEach((profile) => {
          if (!profile.speaker_id || profile.speaker_id === speakerId) return;
          const option = document.createElement("option");
          option.value = profile.speaker_id;
          option.textContent = `${profile.speaker_id} (${profile.num_samples || 0})`;
          speakerSelectEl.appendChild(option);
        });
        speakerSelectEl.value = speakerId;
        speakerIdInputEl.value = speakerId;
      }
      const result = state.lastSpeakerResult || (status.has_profile ? "-" : "未注册");
      const reason = state.lastSpeakerReason ? `（${state.lastSpeakerReason}）` : "";
      speakerStatusEl.innerHTML = "";
      [
        `声纹验证：${enabledText}`,
        `当前身份：${speakerId}`,
        `唤醒范围：${matchModeText}`,
        `已注册身份数：${registeredCount}`,
        `注册样本数：${samples}`,
        `最近匹配身份：${state.lastWakeProbe?.speakerId || "-"}`,
        `最近验证分数：${formatSpeakerScore(state.lastSpeakerScore)}`,
        `最近验证结果：${result}${reason}`,
        `backend: ${status.backend || state.lastWakeProbe?.speakerBackend || "-"}`,
      ].forEach((text) => {
        const item = document.createElement("span");
        item.textContent = text;
        speakerStatusEl.appendChild(item);
      });
    }

    function renderSpeakerEnrollModal() {
      speakerEnrollModalEl.classList.toggle("hidden", !state.speakerEnrollOpen);
      speakerEnrollPhraseEl.textContent = state.wakePhrase || "你好";
      const done = state.speakerEnrollSamples.length;
      const total = state.speakerEnrollTargetSamples;
      speakerEnrollProgressEl.textContent = `第 ${Math.min(done + 1, total)} / ${total} 遍，已完成 ${done} 遍`;
      const pct = Math.max(0, Math.min(100, Math.round(state.speakerEnrollLevel * 100)));
      speakerEnrollLevelFillEl.style.width = `${pct}%`;
      speakerEnrollLevelTextEl.textContent = `${pct}%`;
      speakerEnrollRecordBtn.disabled = state.speakerEnrollRecording || done >= total;
      speakerEnrollSubmitBtn.disabled = state.speakerEnrollRecording || done < total;
      speakerEnrollCloseBtn.disabled = state.speakerEnrollRecording;
      speakerEnrollCancelBtn.disabled = state.speakerEnrollRecording;
      if (done >= total) {
        speakerEnrollHintEl.textContent = "已完成采样，点击“保存声纹”后才会写入身份样本。";
      } else if (!state.speakerEnrollRecording) {
        speakerEnrollHintEl.textContent = "点击“开始录本遍”，然后清楚说出上方唤醒词。";
      }
    }

    function openSpeakerEnrollModal() {
      if (!state.authenticated || state.speakerEnrollRecording) return;
      state.speakerEnrollOpen = true;
      state.speakerEnrollSamples = [];
      state.speakerEnrollLevel = 0;
      renderSpeakerEnrollModal();
    }

    function closeSpeakerEnrollModal() {
      if (state.speakerEnrollRecording) return;
      state.speakerEnrollOpen = false;
      state.speakerEnrollSamples = [];
      state.speakerEnrollLevel = 0;
      renderSpeakerEnrollModal();
    }

    async function loadSpeakerStatus() {
      if (!state.authenticated) {
        updateSpeakerUi();
        return;
      }
      try {
        const data = await api(`/api/speaker/status?speaker_id=${encodeURIComponent(state.currentSpeakerId || "owner")}`);
        state.speakerStatus = data;
        state.currentSpeakerId = data.speaker_id || state.currentSpeakerId || "owner";
        localStorage.setItem("openclaw-webchat-speaker-id", state.currentSpeakerId);
        if (!data.has_profile && !state.lastSpeakerResult) state.lastSpeakerResult = "未注册";
        updateSpeakerUi();
      } catch (err) {
        state.lastSpeakerResult = "状态获取失败";
        state.lastSpeakerReason = err.message;
        updateSpeakerUi();
      }
    }

    async function switchSpeakerIdentity(nextId) {
      const cleaned = String(nextId || "").trim() || "owner";
      state.currentSpeakerId = cleaned;
      localStorage.setItem("openclaw-webchat-speaker-id", cleaned);
      state.lastSpeakerScore = null;
      state.lastSpeakerResult = "";
      state.lastSpeakerReason = "";
      await loadSpeakerStatus();
      logProcess("切换声纹身份", `speaker=${cleaned}`);
    }

    function normalizeWakeText(text) {
      return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:'"()\-_/\\，。！？；：、“”‘’\s]+/g, "");
    }

    function wakeLanguageCode() {
      return /^[\x00-\x7F]+$/.test(state.wakePhrase) ? "en" : "zh";
    }

    function wakeWindowMs() {
      return wakeLanguageCode() === "en" ? WAKE_WINDOW_MS_EN : WAKE_WINDOW_MS_ZH;
    }

    function wakeStepMs() {
      return wakeLanguageCode() === "en" ? WAKE_STEP_MS_EN : WAKE_STEP_MS_ZH;
    }

    function base64Utf8(text) {
      const bytes = new TextEncoder().encode(String(text || ""));
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      return btoa(binary);
    }

    function floatTo16BitPCM(view, offset, input) {
      for (let i = 0; i < input.length; i += 1, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
    }

    function encodeWavBlobFromFloat32(samples, sampleRate) {
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);
      const writeString = (offset, str) => {
        for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, "RIFF");
      view.setUint32(4, 36 + samples.length * 2, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, "data");
      view.setUint32(40, samples.length * 2, true);
      floatTo16BitPCM(view, 44, samples);
      return new Blob([buffer], { type: "audio/wav" });
    }

    function copyLatestWakeWindow(sampleCount) {
      const out = new Float32Array(sampleCount);
      let skip = Math.max(0, state.wakeChunkSamples - sampleCount);
      let offset = 0;
      for (const chunk of state.wakeChunkBuffers) {
        if (skip >= chunk.length) {
          skip -= chunk.length;
          continue;
        }
        const source = skip > 0 ? chunk.subarray(skip) : chunk;
        const n = Math.min(sampleCount - offset, source.length);
        out.set(source.subarray(0, n), offset);
        offset += n;
        skip = 0;
        if (offset >= sampleCount) break;
      }
      return out;
    }

    function trimWakeBuffers(maxSamples) {
      let drop = Math.max(0, state.wakeChunkSamples - maxSamples);
      while (drop > 0 && state.wakeChunkBuffers.length) {
        const chunk = state.wakeChunkBuffers[0];
        if (drop >= chunk.length) {
          state.wakeChunkBuffers.shift();
          state.wakeChunkSamples -= chunk.length;
          drop -= chunk.length;
        } else {
          state.wakeChunkBuffers[0] = chunk.subarray(drop);
          state.wakeChunkSamples -= drop;
          drop = 0;
        }
      }
      state.wakeChunkSamples = Math.max(0, state.wakeChunkSamples);
    }

    function updateWakeUi(extra = "") {
      wakeToggleEl.checked = !!state.wakeEnabled;
      wakePhraseInputEl.value = state.wakePhrase;
      wakeToggleEl.disabled = !state.authenticated || !state.wakeSupported;
      wakePhraseInputEl.disabled = !state.authenticated;
      if (!state.wakeSupported) {
        wakeStatusEl.textContent = "当前浏览器不支持唤醒词";
      } else if (!state.authenticated) {
        wakeStatusEl.textContent = "连接后可启用唤醒词";
      } else if (!state.wakeEnabled) {
        wakeStatusEl.textContent = "唤醒词已关闭";
      } else if (state.recording) {
        wakeStatusEl.textContent = "已唤醒，正在录音";
      } else if (state.wakeListening) {
        wakeStatusEl.textContent = `本地监听中：${state.wakePhrase}`;
      } else if (state.wakeEnabled) {
        wakeStatusEl.textContent = extra || "待机中，等待唤醒词";
      } else {
        wakeStatusEl.textContent = extra || "唤醒词准备中";
      }
    }

    function clearWakeResumeTimer() {
      if (state.wakeResumeTimer) clearTimeout(state.wakeResumeTimer);
      state.wakeResumeTimer = null;
    }

    function scheduleWakeResume(delay = 2200) {
      clearWakeResumeTimer();
      if (!state.wakeEnabled || !state.authenticated || !state.wakeSupported) return;
      state.wakeResumeTimer = setTimeout(() => {
        state.wakeResumeTimer = null;
        void startWakeListener();
      }, delay);
    }

    async function stopWakeListener() {
      clearWakeResumeTimer();
      const recorder = state.wakeRecorder;
      state.wakeRecorder = null;
      state.wakePending = false;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;
        if (recorder.state !== "inactive") {
          try { recorder.stop(); } catch {}
        }
      }
      if (state.stream && !state.recording) {
        state.stream.getTracks().forEach((track) => track.stop());
        state.stream = null;
      }
      if (state.wakeProcessor) {
        try { state.wakeProcessor.disconnect(); } catch {}
      }
      if (state.wakeSilentGain) {
        try { state.wakeSilentGain.disconnect(); } catch {}
      }
      state.wakeProcessor = null;
      state.wakeSilentGain = null;
      state.wakeChunkBuffers = [];
      state.wakeChunkSamples = 0;
      state.wakeSamplesSinceLastCheck = 0;
      if (!state.recording) {
        if (state.meterTimer) cancelAnimationFrame(state.meterTimer);
        state.meterTimer = null;
        if (state.monitorSource) {
          try { state.monitorSource.disconnect(); } catch {}
        }
        if (state.analyser) {
          try { state.analyser.disconnect(); } catch {}
        }
        if (state.monitorContext) {
          try { await state.monitorContext.close(); } catch {}
        }
        state.monitorContext = null;
        state.monitorSource = null;
        state.analyser = null;
        state.inputLevel = 0;
        renderInputLevel();
      }
      state.wakeListening = false;
      updateWakeUi();
      renderPipeline();
    }

    async function startWakeListener() {
      if (!state.wakeSupported || !state.wakeEnabled || !state.authenticated || state.recording || state.busy) {
        updateWakeUi();
        return;
      }
      if (state.wakeListening) return;
      try {
        state.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: state.selectedDeviceId ? { exact: state.selectedDeviceId } : undefined,
            channelCount: 1,
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          },
        });
        startLevelMonitor(state.stream);
        state.wakeChunkBuffers = [];
        state.wakeChunkSamples = 0;
        state.wakeSamplesSinceLastCheck = 0;
        state.wakeChunkSampleRate = state.monitorContext?.sampleRate || 16000;
        const processor = state.monitorContext.createScriptProcessor(4096, 1, 1);
        const silentGain = state.monitorContext.createGain();
        silentGain.gain.value = 0;
        state.wakeProcessor = processor;
        state.wakeSilentGain = silentGain;
        state.wakeListening = true;
        updateWakeUi();
        logProcess("本地唤醒词监听已开启", `${state.wakePhrase}\nclientId=${state.clientId}`);
        renderPipeline();
        processor.onaudioprocess = (event) => {
          if (!state.wakeEnabled || state.recording || !state.wakeListening) return;
          const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
          state.wakeChunkBuffers.push(chunk);
          state.wakeChunkSamples += chunk.length;
          state.wakeSamplesSinceLastCheck += chunk.length;
          void flushWakeChunkIfReady();
        };
        state.monitorSource.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(state.monitorContext.destination);
      } catch (err) {
        state.wakeListening = false;
        updateWakeUi(`唤醒词启动失败：${err.message || err}`);
        logProcess("唤醒词启动失败", String(err.message || err));
      }
    }

    async function checkWakeWord(blob) {
      const reqId = makeId("wake");
      const headers = {
        "Content-Type": blob.type || "application/octet-stream",
        "X-Filename": `wake-${Date.now()}.wav`,
        "X-Wake-Language": wakeLanguageCode(),
        "X-Wake-Phrase-B64": base64Utf8(state.wakePhrase),
        "X-Speaker-Id": state.currentSpeakerId || "owner",
        "X-Speaker-Match-Mode": state.speakerMatchMode === "current" ? "current" : "all",
        "X-Client-Id": state.clientId,
        "X-Request-Id": reqId,
        "X-Session-Key": state.session,
      };
      const data = await api("/api/wake-check", {
        method: "POST",
        headers,
        body: blob,
      });
      state.lastSpeakerScore = data.speaker_score ?? state.lastSpeakerScore;
      state.lastSpeakerResult = data.speaker_enabled
        ? (data.speaker_matched ? "通过" : (data.speaker_reason === "speaker profile not enrolled" ? "未注册" : "未通过"))
        : "已关闭";
      state.lastSpeakerReason = data.speaker_reason || data.speaker_error || "";
      if (data.speaker_id || data.speaker_match_mode) {
        state.lastWakeProbe = {
          ...(state.lastWakeProbe || {}),
          speakerId: data.speaker_id || state.lastWakeProbe?.speakerId || "",
          speakerMatchMode: data.speaker_match_mode || state.speakerMatchMode || "all",
        };
      }
      updateSpeakerUi();
      if (data.wake_matched && !data.speaker_matched) {
        const hint = data.speaker_reason === "speaker profile not enrolled" ? "请先注册声纹" : "身份确认失败";
        statusEl.textContent = `唤醒词命中，但${hint}`;
        logProcess("唤醒词命中但身份确认失败", `${data.speaker_reason || ""}\nscore=${formatSpeakerScore(data.speaker_score)}\nrequestId=${reqId}`);
        return null;
      }
      if (data.matched) {
        logProcess("唤醒词分片命中", `${data.text || ""}\nrequestId=${reqId}`);
        return data;
      }
      return null;
    }

    async function recordSpeakerSample(durationMs = 2500) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: state.selectedDeviceId ? { exact: state.selectedDeviceId } : undefined,
          channelCount: 1,
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      });
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextCtor();
      const sampleRate = context.sampleRate || 16000;
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const silentGain = context.createGain();
      silentGain.gain.value = 0;
      const chunks = [];
      processor.onaudioprocess = (event) => {
        const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
        chunks.push(chunk);
        let sum = 0;
        for (let i = 0; i < chunk.length; i += 1) sum += chunk[i] * chunk[i];
        state.speakerEnrollLevel = Math.min(1, Math.sqrt(sum / Math.max(1, chunk.length)) * 8);
        renderSpeakerEnrollModal();
      };
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(context.destination);
      await new Promise((resolve) => setTimeout(resolve, durationMs));
      try { processor.disconnect(); } catch {}
      try { source.disconnect(); } catch {}
      try { silentGain.disconnect(); } catch {}
      stream.getTracks().forEach((track) => track.stop());
      try { await context.close(); } catch {}
      const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const samples = new Float32Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        samples.set(chunk, offset);
        offset += chunk.length;
      }
      return encodeWavBlobFromFloat32(samples, sampleRate);
    }

    async function enrollSpeakerLegacy() {
      if (!state.authenticated || state.speakerEnrollRecording) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        statusEl.textContent = "当前浏览器不支持录音。";
        return;
      }
      state.speakerEnrollRecording = true;
      updateAuthUi();
      try {
        await stopWakeListener();
        statusEl.textContent = "正在注册声纹，请自然说话约 3 秒...";
        logProcess("开始注册声纹", `clientId=${state.clientId}`);
        const blob = await recordSpeakerSample(3000);
        const data = await api("/api/speaker/enroll", {
          method: "POST",
          headers: {
            "Content-Type": "audio/wav",
            "X-Filename": `speaker-enroll-${Date.now()}.wav`,
            "X-Speaker-Id": state.currentSpeakerId || "owner",
            "X-Client-Id": state.clientId,
            "X-Request-Id": makeId("speaker"),
            "X-Session-Key": state.session,
          },
          body: blob,
        });
        state.lastSpeakerResult = "已注册";
        state.lastSpeakerReason = "";
        statusEl.textContent = `声纹注册成功，样本数：${data.num_samples || 0}`;
        logProcess("声纹注册成功", `speaker=${data.speaker_id || state.currentSpeakerId || "owner"}\nnumSamples=${data.num_samples || 0}`);
        await loadSpeakerStatus();
      } catch (err) {
        state.lastSpeakerResult = "注册失败";
        state.lastSpeakerReason = err.message;
        statusEl.textContent = `声纹注册失败：${err.message}`;
        logProcess("声纹注册失败", err.message);
        updateSpeakerUi();
      } finally {
        state.speakerEnrollRecording = false;
        updateAuthUi();
        if (state.wakeEnabled && state.authenticated && !state.recording) scheduleWakeResume(900);
      }
    }

    async function recordSpeakerEnrollPass() {
      if (!state.authenticated || state.speakerEnrollRecording) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        statusEl.textContent = "当前浏览器不支持录音。";
        return;
      }
      state.speakerEnrollRecording = true;
      updateAuthUi();
      renderSpeakerEnrollModal();
      try {
        await stopWakeListener();
        const pass = state.speakerEnrollSamples.length + 1;
        statusEl.textContent = `正在采集第 ${pass} 遍唤醒词...`;
        speakerEnrollHintEl.textContent = `正在录第 ${pass} 遍，请说：${state.wakePhrase}`;
        logProcess("开始采集声纹样本", `pass=${pass}\nwakePhrase=${state.wakePhrase}\nclientId=${state.clientId}`);
        const blob = await recordSpeakerSample(2500);
        state.speakerEnrollSamples.push(blob);
        state.speakerEnrollLevel = 0;
        statusEl.textContent = `第 ${pass} 遍已采集`;
        renderSpeakerEnrollModal();
      } catch (err) {
        state.lastSpeakerResult = "注册失败";
        state.lastSpeakerReason = err.message;
        statusEl.textContent = `声纹采集失败：${err.message}`;
        logProcess("声纹采集失败", err.message);
        updateSpeakerUi();
      } finally {
        state.speakerEnrollRecording = false;
        state.speakerEnrollLevel = 0;
        updateAuthUi();
        renderSpeakerEnrollModal();
      }
    }

    async function enrollSpeaker() {
      if (!state.authenticated || state.speakerEnrollRecording) return;
      if (state.speakerEnrollSamples.length < state.speakerEnrollTargetSamples) {
        openSpeakerEnrollModal();
        return;
      }
      state.speakerEnrollRecording = true;
      updateAuthUi();
      renderSpeakerEnrollModal();
      try {
        statusEl.textContent = "正在保存声纹样本...";
        let last = null;
        for (let i = 0; i < state.speakerEnrollSamples.length; i += 1) {
          last = await api("/api/speaker/enroll", {
            method: "POST",
            headers: {
              "Content-Type": "audio/wav",
              "X-Filename": `speaker-enroll-${Date.now()}-${i + 1}.wav`,
              "X-Speaker-Id": state.currentSpeakerId || "owner",
              "X-Client-Id": state.clientId,
              "X-Request-Id": makeId("speaker"),
              "X-Session-Key": state.session,
            },
            body: state.speakerEnrollSamples[i],
          });
        }
        state.lastSpeakerResult = "已注册";
        state.lastSpeakerReason = "";
        statusEl.textContent = `声纹注册成功，新增 ${state.speakerEnrollSamples.length} 段样本`;
        logProcess("声纹注册成功", `speaker=${last?.speaker_id || state.currentSpeakerId || "owner"}\nnumSamples=${last?.num_samples || 0}`);
        closeSpeakerEnrollModal();
        await loadSpeakerStatus();
      } catch (err) {
        state.lastSpeakerResult = "注册失败";
        state.lastSpeakerReason = err.message;
        statusEl.textContent = `声纹注册失败：${err.message}`;
        logProcess("声纹注册失败", err.message);
        updateSpeakerUi();
      } finally {
        state.speakerEnrollRecording = false;
        updateAuthUi();
        renderSpeakerEnrollModal();
        if (state.wakeEnabled && state.authenticated && !state.recording) scheduleWakeResume(900);
      }
    }

    async function flushWakeChunkIfReady() {
      const windowSamples = Math.floor(state.wakeChunkSampleRate * (wakeWindowMs() / 1000));
      const stepSamples = Math.floor(state.wakeChunkSampleRate * (wakeStepMs() / 1000));
      if (state.wakePending || state.wakeChunkSamples < windowSamples) return;
      if (state.wakeSamplesSinceLastCheck < stepSamples) return;
      state.wakeSamplesSinceLastCheck = 0;
      state.wakePending = true;
      try {
        const samples = copyLatestWakeWindow(windowSamples);
        trimWakeBuffers(windowSamples);
        const wavBlob = encodeWavBlobFromFloat32(samples, state.wakeChunkSampleRate);
        const wakeResult = await checkWakeWord(wavBlob);
        if (!wakeResult) return;
        const chunkText = wakeResult.text || "";
        const normalized = normalizeWakeText(chunkText);
        const target = normalizeWakeText(state.wakePhrase);
        if (!target || !normalized.includes(target)) return;
        const now = Date.now();
        if (now - state.wakeLastTriggerAt < WAKE_REARM_MS) return;
        state.wakeLastTriggerAt = now;
        logProcess("唤醒词命中", `${chunkText}\nrequestId=${makeId("wake")}`);
        state.wakeEnabled = false;
        stopWakeDebugPolling();
        await stopWakeListener();
        statusEl.textContent = `已检测到唤醒词：${chunkText}`;
        await startRecording({ autoStopOnSilence: true, autoSend: true, wakeDetectedText: chunkText });
      } finally {
        state.wakePending = false;
      }
    }

    function renderMicDevices() {
      const current = state.selectedDeviceId || "";
      micSelectEl.innerHTML = "";
      const devices = state.micDevices || [];
      if (!devices.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "默认麦克风";
        micSelectEl.appendChild(opt);
        micSelectEl.value = "";
        return;
      }
      for (const device of devices) {
        const opt = document.createElement("option");
        opt.value = device.deviceId || "";
        opt.textContent = device.label || `麦克风 ${micSelectEl.options.length + 1}`;
        micSelectEl.appendChild(opt);
      }
      const hasCurrent = devices.some((d) => (d.deviceId || "") === current);
      micSelectEl.value = hasCurrent ? current : (devices[0].deviceId || "");
      state.selectedDeviceId = micSelectEl.value;
    }

    async function refreshMicDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        state.micDevices = devices.filter((d) => d.kind === "audioinput");
        renderMicDevices();
        logProcess("刷新麦克风设备", `${state.micDevices.length} 个输入设备`);
      } catch (err) {
        logProcess("刷新麦克风设备失败", String(err.message || err));
      }
    }

    function startLevelMonitor(stream) {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      state.monitorContext = new AudioContextCtor();
      state.monitorSource = state.monitorContext.createMediaStreamSource(stream);
      state.analyser = state.monitorContext.createAnalyser();
      state.analyser.fftSize = 2048;
      state.monitorSource.connect(state.analyser);
      const data = new Uint8Array(state.analyser.frequencyBinCount);
      const tick = () => {
        if (!state.analyser) return;
        state.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        state.inputLevel = Math.sqrt(sum / data.length) * 4;
        renderInputLevel();
        if (state.recording && state.autoStopOnSilence && !state.stopRequested) {
          const now = Date.now();
          if (state.inputLevel >= AUTO_STOP_LEVEL) {
            state.speechSeenAt = now;
            state.silenceSince = 0;
          } else if (state.speechSeenAt && !state.silenceSince) {
            state.silenceSince = now;
          }
          if (state.recordStartedAt && now - state.recordStartedAt >= AUTO_STOP_MAX_MS) {
            state.stopRequested = true;
            statusEl.textContent = "达到最长录音时长，准备上传...";
            void stopRecordingAndUpload();
            return;
          }
          if (state.speechSeenAt && state.silenceSince && now - state.silenceSince >= AUTO_STOP_SILENCE_MS) {
            state.stopRequested = true;
            statusEl.textContent = "检测到停顿，准备上传...";
            void stopRecordingAndUpload();
            return;
          }
        }
        state.meterTimer = requestAnimationFrame(tick);
      };
      tick();
    }

    function fmtTime(ts) {
      return new Date(ts).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit", second: "2-digit"});
    }

    function renderPipeline() {
      const robotMode = deriveRobotMode();
      robotCardEl.className = `robot-card robot-card--${robotMode.key}`;
      robotModeLabelEl.textContent = robotMode.label;
      robotModeDetailEl.textContent = robotMode.detail;
      const blink = robotMode.key === "idle" || robotMode.key === "thinking";
      robotEyeLeftEl.classList.toggle("robot-shell-figure__eye--blink", blink);
      robotEyeRightEl.classList.toggle("robot-shell-figure__eye--blink", blink);
      robotMouthFillEl.style.width = robotMode.key === "speaking" ? "72%" : robotMode.key === "listening" ? `${Math.max(18, Math.min(86, Math.round(state.inputLevel * 160)))}%` : robotMode.key === "thinking" ? "44%" : "26%";
      pipelineStepsEl.innerHTML = "";
      for (const key of PIPELINE_ORDER) {
        const meta = state.stepState[key] || {status: "idle", detail: "等待"};
        const div = document.createElement("div");
        div.className = `robot-flow__item ${meta.status}`;
        div.innerHTML = `<div class="robot-flow__dot"></div><div><div class="robot-flow__label">${PIPELINE_LABELS[key]}</div><div class="robot-flow__detail">${meta.detail || ""}</div></div>`;
        pipelineStepsEl.appendChild(div);
      }
      if (state.pendingTranscript) {
        robotUserBubbleEl.classList.remove("hidden");
        robotUserBubbleTextEl.textContent = state.pendingTranscript;
      } else {
        robotUserBubbleEl.classList.add("hidden");
        robotUserBubbleTextEl.textContent = "";
      }
      if (state.lastAssistantReply) {
        robotAssistantBubbleEl.classList.remove("hidden");
        robotAssistantBubbleTextEl.textContent = state.lastAssistantReply;
      } else {
        robotAssistantBubbleEl.classList.add("hidden");
        robotAssistantBubbleTextEl.textContent = "";
      }
      processLogEl.innerHTML = "";
      for (const entry of state.processEntries) {
        const div = document.createElement("div");
        div.className = "process-log__item";
        div.innerHTML = `<div class="process-log__time">${fmtTime(entry.ts)}</div><div class="process-log__label">${entry.label}</div><div class="process-log__detail">${entry.detail || ""}</div>`;
        processLogEl.appendChild(div);
      }
      if (state.localCapture && state.localCapture.url) {
        captureProofEl.classList.remove("hidden");
        captureProofMetaEl.textContent = `requestId=${state.localCapture.requestId}\nbytes=${state.localCapture.bytes}\nmimeType=${state.localCapture.mimeType}`;
        captureProofAudioEl.src = state.localCapture.url;
      } else {
        captureProofEl.classList.add("hidden");
        captureProofMetaEl.textContent = "";
        captureProofAudioEl.removeAttribute("src");
      }
      if (state.lastUpload && state.lastUpload.url) {
        uploadProofEl.classList.remove("hidden");
        uploadProofMetaEl.textContent = `clientId=${state.lastUpload.clientId || state.clientId}\nrequestId=${state.lastUpload.requestId || state.currentRequestId}\nsession=${state.lastUpload.session || state.session}\nuploadId=${state.lastUpload.id}\nfilename=${state.lastUpload.filename}\nbytes=${state.lastUpload.bytes}\nsha256=${state.lastUpload.sha256}`;
        uploadProofAudioEl.src = withTokenUrl(state.lastUpload.url);
      } else {
        uploadProofEl.classList.add("hidden");
        uploadProofMetaEl.textContent = "";
        uploadProofAudioEl.removeAttribute("src");
      }
      if (state.lastWakeProbe) {
        wakeProofEl.classList.remove("hidden");
        wakeProofMetaEl.textContent = `engine=${state.lastWakeProbe.engine || "unknown"}\nmatched=${state.lastWakeProbe.matched ? "yes" : "no"}\nwakeMatched=${state.lastWakeProbe.wakeMatched ? "yes" : "no"}\nspeakerMatched=${state.lastWakeProbe.speakerMatched ? "yes" : "no"}\nspeakerId=${state.lastWakeProbe.speakerId || "-"}\nspeakerMatchMode=${state.lastWakeProbe.speakerMatchMode || state.speakerMatchMode || "all"}\nspeakerScore=${formatSpeakerScore(state.lastWakeProbe.speakerScore)}\nspeakerThreshold=${state.lastWakeProbe.speakerThreshold ?? "-"}\nspeakerBackend=${state.lastWakeProbe.speakerBackend || "-"}\nspeakerModel=${state.lastWakeProbe.speakerModelId || "-"}\nspeakerReason=${state.lastWakeProbe.speakerReason || ""}\nspeakerError=${state.lastWakeProbe.speakerError || ""}\nphrase=${state.lastWakeProbe.wakePhrase || state.wakePhrase}\ntext=${state.lastWakeProbe.text || "[empty]"}\nrequestId=${state.lastWakeProbe.requestId || ""}\nbytes=${state.lastWakeProbe.bytes || ""}\nts=${state.lastWakeProbe.ts ? fmtTime(state.lastWakeProbe.ts) : ""}`;
      } else {
        wakeProofEl.classList.add("hidden");
        wakeProofMetaEl.textContent = "";
      }
      if (state.lastTts && state.lastTts.url) {
        ttsProofEl.classList.remove("hidden");
        ttsProofMetaEl.textContent = `requestId=${state.lastTts.requestId}\nvoice=${state.lastTts.voice}\nprovider=${state.lastTts.provider}\nbytes=${state.lastTts.bytes}\nfilename=${state.lastTts.filename}`;
        ttsProofAudioEl.src = withTokenUrl(state.lastTts.url);
      } else {
        ttsProofEl.classList.add("hidden");
        ttsProofMetaEl.textContent = "";
        ttsProofAudioEl.removeAttribute("src");
      }
    }

    function setStep(step, status, detail) {
      if (status === "active") state.stepStartedAt[step] = Date.now();
      state.stepState[step] = {status, detail};
      renderPipeline();
    }

    async function ensureVisibleStep(step, minMs) {
      const startedAt = state.stepStartedAt[step] || 0;
      if (!startedAt) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed < minMs) await new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
    }

    function logProcess(label, detail = "") {
      state.processEntries.unshift({ts: Date.now(), label, detail});
      state.processEntries = state.processEntries.slice(0, 24);
      renderPipeline();
    }

    function resetProcess(reason = "等待新的输入") {
      state.stepState = {
        record: {status: "idle", detail: reason},
        upload: {status: "idle", detail: "未开始"},
        transcribe: {status: "idle", detail: "未开始"},
        transcript: {status: "idle", detail: "等待转写结果"},
        claw: {status: "idle", detail: "等待发送给 OpenClaw"},
      };
      state.pendingTranscript = "";
      state.lastTts = null;
      if (state.localCapture?.url) URL.revokeObjectURL(state.localCapture.url);
      state.localCapture = null;
      state.lastUpload = null;
      state.lastWakeProbe = null;
      state.lastAssistantReply = "";
      state.currentRequestId = "";
      renderPipeline();
    }

    async function enterStandby(reason = "等待唤醒词") {
      state.pendingTranscript = "";
      state.lastWakeProbe = null;
      state.lastAssistantReply = "";
      state.currentRequestId = "";
      draftEl.value = "";
      resetProcess(reason);
      statusEl.textContent = reason;
      if (state.wakeEnabled && state.authenticated) {
        startWakeDebugPolling();
        await startWakeListener();
      }
    }

    function addMessage(role, content) {
      const div = document.createElement("div");
      div.className = `msg ${role}`;
      div.textContent = content;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function renderMessages(items) {
      messagesEl.innerHTML = "";
      if (!items.length) {
        addMessage("system", "新会话已就绪。可以直接发文本，或录音/上传音频。\n\n录音不会在浏览器里识别，而是上传到服务器后转写。")
        return;
      }
      for (const item of items) addMessage(item.role || "system", item.content || "");
    }

    async function api(path, init = {}) {
      const headers = new Headers(init.headers || {});
      if (state.authToken) headers.set("X-Webchat-Token", state.authToken);
      const req = { ...init, headers };
      const res = await fetch(path, req);
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch {}
      if (!res.ok) {
        const message = data && data.error ? data.error : text || `HTTP ${res.status}`;
        throw new Error(message);
      }
      return data;
    }

    async function loadMessages() {
      if (!state.authenticated) {
        statusEl.textContent = "请输入 gateway token 后连接。";
        updateAuthUi();
        return;
      }
      setBusy(true, "加载会话...");
      try {
        const data = await api(`/api/messages?session=${encodeURIComponent(state.session)}`);
        renderMessages(data.messages || []);
        statusEl.textContent = `已加载 ${state.session}`;
        logProcess("会话已加载", `session=${state.session}`);
      } catch (err) {
        statusEl.textContent = `加载失败: ${err.message}`;
        logProcess("会话加载失败", err.message);
      } finally {
        setBusy(false, statusEl.textContent);
      }
    }

    function stopWakeDebugPolling() {
      if (state.wakeDebugTimer) clearInterval(state.wakeDebugTimer);
      state.wakeDebugTimer = null;
    }

    async function pollWakeDebug() {
      if (!state.authenticated || !state.clientId || !state.wakeEnabled) return;
      try {
        const data = await api(`/api/debug/last?clientId=${encodeURIComponent(state.clientId)}&session=${encodeURIComponent(state.session || "")}`);
        const items = Array.isArray(data.items) ? data.items : [];
        const wake = [...items].reverse().find((item) => item.event === "wake_response");
        if (!wake || (Date.now() - Number(wake.ts || 0) > 10000)) {
          state.lastWakeProbe = null;
          renderPipeline();
          return;
        }
        state.lastWakeProbe = {
          ts: wake.ts,
          engine: wake.engine,
          matched: !!wake.matched,
          wakeMatched: !!wake.wakeMatched,
          speakerMatched: !!wake.speakerMatched,
          speakerScore: wake.speakerScore,
          speakerThreshold: wake.speakerThreshold,
          speakerEnabled: !!wake.speakerEnabled,
          speakerId: wake.speakerId || "",
          speakerMatchMode: wake.speakerMatchMode || state.speakerMatchMode || "all",
          speakerBackend: wake.speakerBackend || "",
          speakerModelId: wake.speakerModelId || "",
          speakerReason: wake.speakerReason || "",
          speakerError: wake.speakerError || "",
          text: wake.text || "",
          wakePhrase: wake.wakePhrase || state.wakePhrase,
          requestId: wake.requestId || "",
          bytes: wake.bytes || 0,
        };
        state.lastSpeakerScore = wake.speakerScore ?? state.lastSpeakerScore;
        state.lastSpeakerResult = wake.speakerEnabled
          ? (wake.speakerMatched ? "通过" : (wake.speakerReason === "speaker profile not enrolled" ? "未注册" : "未通过"))
          : "已关闭";
        state.lastSpeakerReason = wake.speakerReason || "";
        updateSpeakerUi();
        renderPipeline();
      } catch {}
    }

    function startWakeDebugPolling() {
      stopWakeDebugPolling();
      if (!state.authenticated || !state.wakeEnabled) return;
      state.wakeDebugTimer = setInterval(() => {
        void pollWakeDebug();
      }, 1200);
      void pollWakeDebug();
    }

    async function connectWithToken(token) {
      state.authToken = (token || "").trim();
      tokenInputEl.value = state.authToken;
      if (!state.authToken) {
        state.authenticated = false;
        updateAuthUi();
        statusEl.textContent = "请输入 gateway token。";
        return;
      }
      setBusy(true, "正在校验 gateway token...");
      try {
        await api("/api/auth/check");
        state.authenticated = true;
        sessionStore.setItem("openclaw-webchat-auth-token", state.authToken);
        updateAuthUi();
        statusEl.textContent = "已连接";
        logProcess("通过 gateway token 连接", `clientId=${state.clientId}`);
        await loadMessages();
        await loadSpeakerStatus();
        await enterStandby(`已连接，等待唤醒词：${state.wakePhrase}`);
      } catch (err) {
        state.authenticated = false;
        updateAuthUi();
        statusEl.textContent = `认证失败: ${err.message}`;
        stopWakeDebugPolling();
      } finally {
        setBusy(false, statusEl.textContent);
      }
    }

    async function sendMessage(message, opts = {}) {
      const text = (message || draftEl.value).trim();
      if (!text || state.busy) return;
      const requestId = opts.requestId || state.currentRequestId || makeId("chat");
      draftEl.value = "";
      addMessage("user", text);
      addMessage("system", "处理中...");
      setBusy(true, "OpenClaw 正在回复...");
      state.pendingTranscript = "";
      setStep("claw", "active", `文本已经送进 OpenClaw，等待回复\nrequestId=${requestId}`);
      logProcess("送进 OpenClaw", `${text}\nclientId=${state.clientId}\nrequestId=${requestId}\nsession=${state.session}`);
      try {
        const data = await api("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Id": state.clientId,
            "X-Request-Id": requestId,
            "X-Session-Key": state.session,
          },
          body: JSON.stringify({ session: state.session, message: text }),
        });
        await ensureVisibleStep("claw", 900);
        renderMessages(data.messages || []);
        state.lastAssistantReply = data.reply || "";
        statusEl.textContent = "已完成";
        setStep("claw", "done", `runId=${data.runId || "unknown"}\nrequestId=${requestId}`);
        logProcess("OpenClaw 回复完成", `${data.reply || ""}\nclientId=${state.clientId}\nrequestId=${requestId}`);
        if (state.autoTts && data.reply) {
          await synthesizeReplyAudio(data.reply, requestId);
        }
        state.currentRequestId = "";
      } catch (err) {
        statusEl.textContent = `发送失败: ${err.message}`;
        setStep("claw", "error", `${err.message}\nrequestId=${requestId}`);
        logProcess("OpenClaw 回复失败", `${err.message}\nclientId=${state.clientId}\nrequestId=${requestId}`);
        await loadMessages();
      } finally {
        if (state.wakeEnabled && state.authenticated && !state.recording && !state.autoTts) scheduleWakeResume(900);
        setBusy(false, statusEl.textContent);
      }
    }

    async function synthesizeReplyAudio(text, requestId) {
      setStep("tts", "active", `mode=${state.ttsMode}\nvoice=${state.ttsVoice}\nrequestId=${requestId}`);
      logProcess("开始合成回复语音", `${text}\nmode=${state.ttsMode}\nvoice=${state.ttsVoice}\nrequestId=${requestId}`);
      try {
        const data = await api("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Id": state.clientId,
            "X-Request-Id": requestId,
            "X-Session-Key": state.session,
          },
          body: JSON.stringify({
            text,
            mode: state.ttsMode,
            voice: state.ttsVoice,
            session: state.session,
          }),
        });
        await ensureVisibleStep("tts", 700);
        state.lastTts = data.audio || null;
        setStep("tts", "done", `mode=${data.audio?.mode || state.ttsMode}\nvoice=${data.audio?.voice || state.ttsVoice}\nrequestId=${requestId}`);
        logProcess("回复语音完成", `${data.audio?.filename || ""}\nprovider=${data.audio?.provider || ""}\nmode=${data.audio?.mode || state.ttsMode}\nrequestId=${requestId}`);
        renderPipeline();
        if (ttsProofAudioEl) {
          ttsProofAudioEl.pause();
          ttsProofAudioEl.currentTime = 0;
          void ttsProofAudioEl.play().then(() => {
            if (state.wakeEnabled) updateWakeUi("回复播放中，结束后自动回到待机");
          }).catch(() => {
            if (state.wakeEnabled && state.authenticated && !state.recording) scheduleWakeResume(1200);
          });
        }
      } catch (err) {
        setStep("tts", "error", `${err.message}\nrequestId=${requestId}`);
        logProcess("回复语音失败", `${err.message}\nrequestId=${requestId}`);
        if (state.wakeEnabled && state.authenticated && !state.recording) scheduleWakeResume(1200);
      }
    }

    async function transcribeBlob(blob, filename, opts = {}) {
      setBusy(true, "音频转写中...");
      const requestId = opts.requestId || state.currentRequestId || makeId("tx");
      state.currentRequestId = requestId;
      state.lastUpload = null;
      try {
        const kb = Math.round((blob.size || 0) / 1024);
        statusEl.textContent = `上传音频到服务器 (${kb} KB)...`;
        setStep("upload", "active", `${filename} / ${kb} KB\nrequestId=${requestId}`);
        logProcess("上传到服务器", `${filename} / ${kb} KB\nclientId=${state.clientId}\nrequestId=${requestId}\nsession=${state.session}`);
        const data = await api("/api/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": blob.type || "application/octet-stream",
            "X-Filename": filename || "audio.wav",
            "X-ASR-Language": state.transcriptLanguage || "zh",
            "X-Client-Id": state.clientId,
            "X-Request-Id": requestId,
            "X-Session-Key": state.session,
          },
          body: blob,
        });
        await ensureVisibleStep("transcribe", 700);
        state.lastUpload = data.upload || null;
        state.pendingTranscript = data.text || "";
        draftEl.value = state.pendingTranscript;
        statusEl.textContent = `转写完成，请确认文本后再发送：${data.text}`;
        setStep("upload", "done", `${filename} 已上传\nrequestId=${requestId}`);
        setStep("transcribe", "done", `requested=${state.transcriptLanguage} / detected=${data.meta?.language || "unknown"}\nrequestId=${requestId}`);
        setStep("transcript", "done", `${data.text || "[empty]"}\nrequestId=${requestId}`);
        logProcess("服务器转写完成", `${data.text || "[empty]"}\nclientId=${state.clientId}\nrequestId=${requestId}\nuploadId=${data.upload?.id || "unknown"}\nsha256=${data.upload?.sha256 || "unknown"}`);
        setBusy(false, statusEl.textContent);
        const shouldAutoSend = opts.autoSendOverride === true || state.autoSend;
        if (shouldAutoSend) await sendMessage(data.text || "", {requestId});
        else if (state.wakeEnabled && state.authenticated) scheduleWakeResume(1800);
      } catch (err) {
        statusEl.textContent = `转写失败: ${err.message}`;
        setStep("upload", "done", `${filename} 已上传\nrequestId=${requestId}`);
        setStep("transcribe", "error", `${err.message}\nrequestId=${requestId}`);
        logProcess("服务器转写失败", `${err.message}\nclientId=${state.clientId}\nrequestId=${requestId}`);
        setBusy(false, statusEl.textContent);
        if (state.wakeEnabled && state.authenticated) scheduleWakeResume(1800);
      }
    }

    async function cleanupRecording() {
      if (state.meterTimer) cancelAnimationFrame(state.meterTimer);
      state.meterTimer = null;
      if (state.monitorSource) {
        try { state.monitorSource.disconnect(); } catch {}
      }
      if (state.analyser) {
        try { state.analyser.disconnect(); } catch {}
      }
      if (state.monitorContext) {
        try { await state.monitorContext.close(); } catch {}
      }
      state.monitorContext = null;
      state.monitorSource = null;
      state.analyser = null;
      state.inputLevel = 0;
      renderInputLevel();
      if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
      state.mediaRecorder = null;
      state.mediaChunks = [];
      state.recording = false;
      state.currentRecordAutoSend = false;
      state.currentRecordWakeTriggered = false;
      state.autoStopOnSilence = false;
      state.recordStartedAt = 0;
      state.speechSeenAt = 0;
      state.silenceSince = 0;
      state.stopRequested = false;
      recordBtn.textContent = "开始录音";
      updateWakeUi();
    }

    async function stopRecordingAndUpload() {
      if (!state.recording) return;
      if (state.stopRequested && !state.mediaRecorder) return;
      state.recording = false;
      recordBtn.disabled = true;
      recordBtn.textContent = "处理中...";
      const recorder = state.mediaRecorder;
      if (!recorder) {
        await cleanupRecording();
        recordBtn.disabled = false;
        setStep("record", "error", "录音器不存在");
        logProcess("录音失败", "录音器不存在");
        return;
      }
      const stopped = new Promise((resolve, reject) => {
        recorder.addEventListener("stop", resolve, { once: true });
        recorder.addEventListener("error", (event) => reject(event.error || new Error("MediaRecorder error")), { once: true });
      });
      recorder.stop();
      try {
        await stopped;
        const blob = new Blob(state.mediaChunks, { type: recorder.mimeType || "audio/webm" });
        const sizeKb = Math.round((blob.size || 0) / 1024);
        const requestId = makeId("tx");
        if (state.localCapture?.url) URL.revokeObjectURL(state.localCapture.url);
        state.localCapture = {
          requestId,
          bytes: blob.size || 0,
          mimeType: blob.type || "audio/webm",
          url: URL.createObjectURL(blob),
        };
        await cleanupRecording();
        recordBtn.disabled = false;
        statusEl.textContent = `录音完成，准备上传浏览器原始录音 (${sizeKb} KB, ${blob.type || "unknown"})`;
        setStep("record", "done", `${sizeKb} KB / ${blob.type || "unknown"}`);
        setStep("upload", "active", "等待浏览器开始上传");
        setStep("transcribe", "active", "服务器收到音频后会开始转写");
        logProcess("录音完成", `${sizeKb} KB / ${blob.type || "unknown"}\nrequestId=${requestId}`);
        renderPipeline();
        const ext = blob.type.includes("webm") ? "webm" : blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "bin";
        await transcribeBlob(blob, `recording-${Date.now()}.${ext}`, { requestId, autoSendOverride: state.currentRecordAutoSend });
      } catch (err) {
        await cleanupRecording();
        recordBtn.disabled = false;
        statusEl.textContent = `录音停止失败: ${err.message || err}`;
        setStep("record", "error", String(err.message || err));
        logProcess("录音停止失败", String(err.message || err));
      }
    }

    async function startRecording(opts = {}) {
      if (state.recording) {
        await stopRecordingAndUpload();
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        statusEl.textContent = "当前浏览器不支持录音。";
        return;
      }
      if (!window.MediaRecorder) {
        statusEl.textContent = "当前浏览器不支持 MediaRecorder 录音。";
        return;
      }
      try {
        await stopWakeListener();
        state.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: state.selectedDeviceId ? { exact: state.selectedDeviceId } : undefined,
            channelCount: 1,
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          },
        });
        await refreshMicDevices();
        startLevelMonitor(state.stream);
        const mimeCandidates = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
          "audio/mp4",
        ];
        const mimeType = mimeCandidates.find((mime) => MediaRecorder.isTypeSupported?.(mime)) || "";
        state.mediaChunks = [];
        state.mediaRecorder = new MediaRecorder(state.stream, mimeType ? { mimeType } : undefined);
        state.mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data && event.data.size > 0) state.mediaChunks.push(event.data);
        });
        state.mediaRecorder.start();
        state.recording = true;
        state.currentRecordAutoSend = !!opts.autoSend;
        state.currentRecordWakeTriggered = !!opts.wakeDetectedText;
        state.autoStopOnSilence = !!opts.autoStopOnSilence;
        state.recordStartedAt = Date.now();
        state.speechSeenAt = 0;
        state.silenceSince = 0;
        state.stopRequested = false;
        recordBtn.textContent = "停止录音";
        statusEl.textContent = state.currentRecordWakeTriggered
          ? `已唤醒，正在录音（${state.mediaRecorder.mimeType || "default"}）。说完后会自动发送。`
          : `录音中（${state.mediaRecorder.mimeType || "default"}）。先看右侧输入电平条是否波动；有波动再继续。`;
        resetProcess("录音已经开始");
        const recordDetail = `${state.mediaRecorder.mimeType || "default"}${state.autoStopOnSilence ? "\n自动停录已开启" : ""}${state.currentRecordAutoSend ? "\n本轮将自动发送" : ""}`;
        setStep("record", "active", recordDetail);
        logProcess("开始录音", `浏览器原始录音格式 ${state.mediaRecorder.mimeType || "default"}\nselectedDeviceId=${state.selectedDeviceId || "default"}${opts.wakeDetectedText ? `\n唤醒词=${opts.wakeDetectedText}` : ""}`);
        updateWakeUi();
      } catch (err) {
        await cleanupRecording();
        statusEl.textContent = `录音失败: ${err.message}`;
        setStep("record", "error", err.message);
        logProcess("录音失败", err.message);
      }
    }

    sendBtn.addEventListener("click", () => sendMessage());
    draftEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        sendMessage();
      }
    });
    recordBtn.addEventListener("click", () => startRecording());
    uploadBtn.addEventListener("click", () => audioInput.click());
    authBtnEl.addEventListener("click", () => connectWithToken(tokenInputEl.value));
    tokenInputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        connectWithToken(tokenInputEl.value);
      }
    });
    micSelectEl.addEventListener("change", () => {
      state.selectedDeviceId = micSelectEl.value || "";
      sessionStore.setItem("openclaw-webchat-mic-device", state.selectedDeviceId);
      logProcess("切换麦克风设备", state.selectedDeviceId || "default");
    });
    refreshMicsBtn.addEventListener("click", () => refreshMicDevices());
    speakerSelectEl.addEventListener("change", () => switchSpeakerIdentity(speakerSelectEl.value));
    speakerSwitchBtn.addEventListener("click", () => switchSpeakerIdentity(speakerIdInputEl.value));
    speakerIdInputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        switchSpeakerIdentity(speakerIdInputEl.value);
      }
    });
    speakerMatchModeSelectEl.addEventListener("change", () => {
      state.speakerMatchMode = speakerMatchModeSelectEl.value === "current" ? "current" : "all";
      localStorage.setItem("openclaw-webchat-speaker-match-mode", state.speakerMatchMode);
      updateSpeakerUi();
      logProcess("切换唤醒身份范围", state.speakerMatchMode === "current" ? "仅当前身份可唤醒" : "所有身份可唤醒");
    });
    speakerEnrollBtn.addEventListener("click", () => enrollSpeaker());
    speakerRefreshBtn.addEventListener("click", () => loadSpeakerStatus());
    speakerEnrollRecordBtn.addEventListener("click", () => recordSpeakerEnrollPass());
    speakerEnrollSubmitBtn.addEventListener("click", () => enrollSpeaker());
    speakerEnrollCancelBtn.addEventListener("click", () => closeSpeakerEnrollModal());
    speakerEnrollCloseBtn.addEventListener("click", () => closeSpeakerEnrollModal());
    wakeToggleEl.addEventListener("change", async () => {
      state.wakeEnabled = !!wakeToggleEl.checked;
      if (state.wakeEnabled) {
        state.lastWakeProbe = null;
        logProcess("开启唤醒词", `${state.wakePhrase}\nclientId=${state.clientId}`);
        await enterStandby(`待机中，等待唤醒词：${state.wakePhrase}`);
      } else {
        logProcess("关闭唤醒词", `clientId=${state.clientId}`);
        stopWakeDebugPolling();
        state.lastWakeProbe = null;
        await stopWakeListener();
      }
      updateWakeUi();
      renderPipeline();
    });
    wakePhraseInputEl.addEventListener("change", async () => {
      state.wakePhrase = (wakePhraseInputEl.value || "你好").trim() || "你好";
      localStorage.setItem("openclaw-webchat-wake-phrase", state.wakePhrase);
      logProcess("更新唤醒词", `${state.wakePhrase}\nclientId=${state.clientId}`);
      if (state.wakeEnabled) {
        await stopWakeListener();
        await startWakeListener();
      } else {
        updateWakeUi();
      }
    });
    languageSelectEl.addEventListener("change", () => {
      state.transcriptLanguage = languageSelectEl.value || "zh";
      localStorage.setItem("openclaw-webchat-language", state.transcriptLanguage);
      logProcess("切换转写语言", `${state.transcriptLanguage}\nclientId=${state.clientId}`);
      if (state.wakeEnabled) {
        void stopWakeListener().then(() => startWakeListener());
      }
    });
    autoSendToggleEl.addEventListener("change", () => {
      state.autoSend = !!autoSendToggleEl.checked;
      localStorage.setItem("openclaw-webchat-auto-send", state.autoSend ? "1" : "0");
      logProcess("切换自动发送", `${state.autoSend ? "on" : "off"}\nclientId=${state.clientId}`);
    });
    ttsModeSelectEl.addEventListener("change", () => {
      state.ttsMode = ttsModeSelectEl.value || "api";
      localStorage.setItem("openclaw-webchat-tts-mode", state.ttsMode);
      logProcess("切换回复语音模式", `${state.ttsMode}\nclientId=${state.clientId}`);
    });
    ttsVoiceSelectEl.addEventListener("change", () => {
      state.ttsVoice = ttsVoiceSelectEl.value || "zh-CN-XiaoxiaoNeural";
      localStorage.setItem("openclaw-webchat-tts-voice", state.ttsVoice);
      logProcess("切换回复语音", `${state.ttsVoice}\nclientId=${state.clientId}`);
    });
    autoTtsToggleEl.addEventListener("change", () => {
      state.autoTts = !!autoTtsToggleEl.checked;
      localStorage.setItem("openclaw-webchat-auto-tts", state.autoTts ? "1" : "0");
      logProcess("切换自动回复语音", `${state.autoTts ? "on" : "off"}\nclientId=${state.clientId}`);
    });
    audioInput.addEventListener("change", async () => {
      const file = audioInput.files && audioInput.files[0];
      audioInput.value = "";
      if (!file) return;
      await transcribeBlob(file, file.name || `upload-${Date.now()}`);
    });
    reloadBtn.addEventListener("click", loadMessages);
    newSessionBtn.addEventListener("click", () => {
      setSession(makeSession());
      renderMessages([]);
      statusEl.textContent = `已切换到 ${state.session}`;
      logProcess("切换到新会话", state.session);
      void pollWakeDebug();
      void enterStandby(`新会话待机，等待唤醒词：${state.wakePhrase}`);
    });
    sessionEl.addEventListener("change", () => {
      const next = sessionEl.value.trim();
      if (!next) return;
      setSession(next);
      logProcess("切换会话", next);
      void pollWakeDebug();
      loadMessages().then(() => enterStandby(`会话已切换，等待唤醒词：${state.wakePhrase}`));
    });

    const initial = qsSession() || sessionStore.getItem("openclaw-webchat-session") || makeSession();
    const initialToken = new URL(window.location.href).searchParams.get("token") || sessionStore.getItem("openclaw-webchat-auth-token") || "";
    const savedLanguage = localStorage.getItem("openclaw-webchat-language");
    state.transcriptLanguage = savedLanguage || (((navigator.language || "").toLowerCase().startsWith("zh")) ? "zh" : "auto");
    state.autoSend = localStorage.getItem("openclaw-webchat-auto-send") === "1";
    state.autoTts = localStorage.getItem("openclaw-webchat-auto-tts") !== "0";
    state.ttsMode = localStorage.getItem("openclaw-webchat-tts-mode") || "api";
    state.ttsVoice = localStorage.getItem("openclaw-webchat-tts-voice") || "zh-CN-XiaoxiaoNeural";
    state.wakeEnabled = true;
    const storedWakePhrase = localStorage.getItem("openclaw-webchat-wake-phrase") || "";
    state.wakePhrase = (!storedWakePhrase || storedWakePhrase === "hey robot" || storedWakePhrase === "机器人你好") ? "你好" : storedWakePhrase;
    state.wakeSupported = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
    state.clientId = localStorage.getItem("openclaw-webchat-client-id") || makeId("client");
    state.selectedDeviceId = sessionStore.getItem("openclaw-webchat-mic-device") || "";
    localStorage.setItem("openclaw-webchat-client-id", state.clientId);
    languageSelectEl.value = state.transcriptLanguage;
    autoSendToggleEl.checked = state.autoSend;
    ttsModeSelectEl.value = state.ttsMode;
    ttsVoiceSelectEl.value = state.ttsVoice;
    autoTtsToggleEl.checked = state.autoTts;
    wakeToggleEl.checked = state.wakeEnabled;
    wakePhraseInputEl.value = state.wakePhrase;
    speakerMatchModeSelectEl.value = state.speakerMatchMode === "current" ? "current" : "all";
    tokenInputEl.value = initialToken;
    renderInputLevel();
    updateAuthUi();
    updateWakeUi();
    updateSpeakerUi();
    renderSpeakerEnrollModal();
    refreshMicDevices();
    setSession(initial);
    resetProcess("页面已就绪");
    logProcess("页面已就绪", `clientId=${state.clientId}\nsession=${initial}\nlanguage=${state.transcriptLanguage}\nautoSend=${state.autoSend}\nautoTts=${state.autoTts}\nttsVoice=${state.ttsVoice}`);
    if (initialToken) {
      connectWithToken(initialToken);
    } else {
      statusEl.textContent = "请输入 gateway token 后连接。";
    }
    ttsProofAudioEl.addEventListener("ended", () => {
      if (state.wakeEnabled && state.authenticated && !state.recording) {
        updateWakeUi("回复结束，回到待机");
        scheduleWakeResume(400);
      }
    });
  
