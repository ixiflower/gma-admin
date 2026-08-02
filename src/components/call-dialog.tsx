"use client";

import { useEffect, useRef } from "react";
import { Phone, PhoneOff, PhoneIncoming } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CallState {
  status: "idle" | "ringing" | "calling" | "connected" | "ended";
  peerName: string;
  stream: MediaStream | null;
}

export function CallDialog({
  call,
  onAccept,
  onReject,
  onHangUp,
}: {
  call: CallState;
  onAccept: () => void;
  onReject: () => void;
  onHangUp: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (call.stream && audioRef.current) {
      audioRef.current.srcObject = call.stream;
    }
  }, [call.stream]);

  const isOpen = call.status !== "idle" && call.status !== "ended";

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm text-center" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {call.status === "ringing" ? "Incoming call" : call.status === "calling" ? "Calling..." : "In call"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {call.status === "connected" ? "Connected" : call.peerName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar className="size-20">
            <AvatarFallback className="text-xl">
              {call.peerName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-lg font-medium">{call.peerName}</p>

          <audio ref={audioRef} autoPlay playsInline className="hidden" />

          <div className="flex items-center gap-4">
            {call.status === "ringing" ? (
              <>
                <Button variant="destructive" size="lg" className="rounded-full size-14" onClick={onReject}>
                  <PhoneOff className="size-6" />
                </Button>
                <Button size="lg" className="rounded-full size-14 bg-emerald-500 hover:bg-emerald-600" onClick={onAccept}>
                  <Phone className="size-6" />
                </Button>
              </>
            ) : (
              <Button variant="destructive" size="lg" className="rounded-full size-14" onClick={onHangUp}>
                <PhoneOff className="size-6" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
