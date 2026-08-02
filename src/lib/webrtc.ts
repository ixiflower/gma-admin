"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface CallState {
  status: "idle" | "ringing" | "calling" | "connected" | "ended";
  peerId: number | null;
  peerName: string;
  stream: MediaStream | null;
}

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function useWebRTC() {
  const [call, setCall] = useState<CallState>({
    status: "idle", peerId: null, peerName: "", stream: null,
  });
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startCall = useCallback(async (peerId: number, peerName: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    setCall({ status: "calling", peerId, peerName, stream });
    return { type: "call_offer" as const, sdp: JSON.stringify(offer) };
  }, []);

  const answerCall = useCallback(async (peerId: number, peerName: string, offerSdp: string) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    const pc = new RTCPeerConnection(iceServers);
    pcRef.current = pc;
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    await pc.setRemoteDescription(JSON.parse(offerSdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    setCall({ status: "connected", peerId, peerName, stream });
    return { type: "call_answer" as const, sdp: JSON.stringify(answer) };
  }, []);

  const acceptAnswer = useCallback(async (answerSdp: string) => {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(JSON.parse(answerSdp));
    setCall((prev) => ({ ...prev, status: "connected" }));
  }, []);

  const hangUp = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setCall({ status: "idle", peerId: null, peerName: "", stream: null });
    return { type: "call_end" as const };
  }, []);

  const receiveCall = useCallback((peerId: number, peerName: string) => {
    setCall({ status: "ringing", peerId, peerName, stream: null });
  }, []);

  return { call, startCall, answerCall, acceptAnswer, hangUp, receiveCall };
}
