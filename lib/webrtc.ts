import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import type { PartyMessage, PresenceUser } from "./partyChannel";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export interface VoicePeerAudio {
  peerId: string;
  stream: MediaStream;
  level: number;
}

type PeerSignal = Parameters<Peer.Instance["signal"]>[0];

/**
 * Simple-peer voice mesh. Each party member runs this hook with a list of
 * current participants and a "send" callback. SDP/ICE packets ride over the
 * same party Supabase channel via the `voice-sdp` / `voice-ice` message kinds.
 */
export function useVoice(params: {
  enabled: boolean;
  selfId: string;
  participants: PresenceUser[];
  send: (msg: Omit<PartyMessage, "at">) => void;
  onMessage: PartyMessage;
  micOn: boolean;
}) {
  const micStream = useRef<MediaStream | undefined>(undefined);
  const peers = useRef<Map<string, Peer.Instance>>(new Map());
  const audioCtx = useRef<AudioContext | undefined>(undefined);
  const analysers = useRef<Map<string, { analyser: AnalyserNode | null; stream: MediaStream }> | undefined>(undefined);
  const getAnalysers = () => (analysers.current ??= new Map());
  const [audioLevels, setAudioLevels] = useState<Map<string, number>>(new Map());

  const teardown = useCallback((peerId: string) => {
    peers.current.get(peerId)?.destroy();
    peers.current.delete(peerId);
    getAnalysers().delete(peerId);
  }, []);

  const ensureMic = useCallback(async () => {
    if (micStream.current) return micStream.current;
    micStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return micStream.current;
  }, []);

  const spawnPeer = useCallback((peerId: string) => {
    if (peers.current.has(peerId)) return;
    const peer = new Peer({
      initiator: true,
      stream: micStream.current,
      config: { iceServers: ICE_SERVERS },
    });
    peer.on("signal", (signal: PeerSignal) => {
      params.send({ kind: "voice-sdp", target: peerId, sdp: signal, by: params.selfId } as Omit<PartyMessage, "at">);
    });
    peer.on("stream", (stream: MediaStream) => {
      try {
        const ctx = audioCtx.current ?? new AudioContext();
        audioCtx.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        getAnalysers().set(peerId, { analyser, stream });
      } catch {
        getAnalysers().set(peerId, { analyser: null, stream });
      }
    });
    peer.on("close", () => teardown(peerId));
    peer.on("error", () => teardown(peerId));
    peers.current.set(peerId, peer);
  }, [params, teardown]);

  /** Cleanup peers that left */
  useEffect(() => {
    if (!params.enabled) return;
    const liveIds = new Set(params.participants.map((p) => p.userId));
    for (const id of Array.from(peers.current.keys())) {
      if (!liveIds.has(id)) teardown(id);
    }
  }, [params.enabled, params.participants, teardown]);

  /** Spawn peers to any participant when enabled + mic on */
  useEffect(() => {
    if (!params.enabled || !params.micOn) return;
    (async () => {
      await ensureMic();
      for (const p of params.participants) {
        if (p.userId !== params.selfId && !peers.current.has(p.userId)) {
          spawnPeer(p.userId);
        }
      }
    })();
  }, [params.enabled, params.micOn, params.participants, params.selfId, ensureMic, spawnPeer]);

  /** Handle incoming SDP/ICE packets */
  useEffect(() => {
    if (!params.enabled) return;
    const m = params.onMessage;
    if (!m || (m.kind !== "voice-sdp" && m.kind !== "voice-ice")) return;
    if (m.by === params.selfId) return;
    if (m.target && m.target !== params.selfId) return;

    if (m.kind === "voice-sdp") {
      const existing = peers.current.get(m.by);
      if (existing) {
        existing.signal(m.sdp as PeerSignal);
      } else {
        const peer = new Peer({ initiator: false, stream: micStream.current, config: { iceServers: ICE_SERVERS } });
        peer.on("signal", (signal: PeerSignal) => {
          params.send({ kind: "voice-sdp", target: m.by, sdp: signal, by: params.selfId } as Omit<PartyMessage, "at">);
        });
        peer.on("stream", (stream: MediaStream) => {
          try {
            const ctx = audioCtx.current ?? new AudioContext();
            audioCtx.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            getAnalysers().set(m.by, { analyser, stream });
          } catch {
            getAnalysers().set(m.by, { analyser: null, stream });
          }
        });
        peer.on("close", () => teardown(m.by));
        peer.on("error", () => teardown(m.by));
        peers.current.set(m.by, peer);
        peer.signal(m.sdp as PeerSignal);
      }
    } else if (m.kind === "voice-ice") {
      const peer = peers.current.get(m.by);
      if (peer) peer.signal({ candidate: m.candidate } as PeerSignal);
    }
  }, [params.enabled, params.onMessage, params.selfId, params.send, teardown]);

  // VU level polling
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const next = new Map<string, number>();
      getAnalysers().forEach((a, peerId) => {
        if (!a.analyser) return;
        try {
          const data = new Uint8Array(a.analyser.frequencyBinCount);
          a.analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) sum += Math.abs(v - 128);
          next.set(peerId, Math.min(1, sum / data.length / 64));
        } catch { next.set(peerId, 0); }
      });
      if (next.size) setAudioLevels(next);
      id = window.requestAnimationFrame(tick);
    };
    id = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(id);
  }, []);

  // mic mute control
  useEffect(() => {
    micStream.current?.getAudioTracks().forEach((t) => { t.enabled = params.micOn; });
  }, [params.micOn]);

  // destroy all on cleanup
  useEffect(() => {
    return () => {
      peers.current.forEach((p) => p.destroy());
      analysers.current?.clear();
      if (audioCtx.current && audioCtx.current.state !== "closed") audioCtx.current.close();
      micStream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const levelList: VoicePeerAudio[] = Array.from(audioLevels.entries()).map(([peerId, level]) => {
    const a = getAnalysers().get(peerId);
    return { peerId, stream: a?.stream ?? new MediaStream(), level };
  });

  return { levelList };
}
