import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from 'lucide-react'

export function ShortcutHelpContent() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogDescription>
          Quick reference for keyboard shortcuts in the Voice Memo App.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 items-center gap-4">
          <span className="font-medium">Start/Stop Recording</span>
          <kbd className="font-mono text-sm">Ctrl + S</kbd>
        </div>
        <div className="grid grid-cols-2 items-center gap-4">
          <span className="font-medium">Mute/Unmute</span>
          <kbd className="font-mono text-sm">Ctrl + M</kbd>
        </div>
      </div>
    </>
  )
}

export function ShortcutHelpModal() {
  return (
    <Dialog>
      <DialogContent className="sm:max-w-[425px]">
        <ShortcutHelpContent />
      </DialogContent>
    </Dialog>
  )
}

