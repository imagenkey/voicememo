import React from 'react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShortcutHelpContent } from './ShortcutHelpModal'

interface Microphone {
  deviceId: string | null;
  label: string;
}

interface SettingsDialogProps {
  usePunctuation: boolean
  setUsePunctuation: (value: boolean) => void
  useQuestionMark: boolean
  setUseQuestionMark: (value: boolean) => void
  useArabicNumerals: boolean
  setUseArabicNumerals: (value: boolean) => void
  insertLineBreaks: boolean
  setInsertLineBreaks: (value: boolean) => void
  useDoubleLineBreaks: boolean
  setUseDoubleLineBreaks: (value: boolean) => void
  showInterimResults: boolean
  setShowInterimResults: (value: boolean) => void
  customWords: string
  setCustomWords: (value: string) => void
  numberOfPages: number
  setNumberOfPages: (value: number) => void
  availableMicrophones: Microphone[]
  selectedMicrophone: string | null
  setSelectedMicrophone: (deviceId: string) => void
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  usePunctuation, 
  setUsePunctuation, 
  useQuestionMark, 
  setUseQuestionMark, 
  useArabicNumerals, 
  setUseArabicNumerals, 
  insertLineBreaks, 
  setInsertLineBreaks, 
  useDoubleLineBreaks, 
  setUseDoubleLineBreaks, 
  showInterimResults, 
  setShowInterimResults, 
  customWords, 
  setCustomWords,
  numberOfPages,
  setNumberOfPages,
  availableMicrophones,
  selectedMicrophone,
  setSelectedMicrophone
}) => {
  const { theme, setTheme } = useTheme()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 p-0"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="usePunctuation"
              checked={usePunctuation}
              onCheckedChange={(checked) => setUsePunctuation(checked as boolean)}
            />
            <Label htmlFor="usePunctuation">句読点を使用</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useQuestionMark"
              checked={useQuestionMark}
              onCheckedChange={(checked) => setUseQuestionMark(checked as boolean)}
            />
            <Label htmlFor="useQuestionMark">疑問符を使用</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useArabicNumerals"
              checked={useArabicNumerals}
              onCheckedChange={(checked) => setUseArabicNumerals(checked as boolean)}
            />
            <Label htmlFor="useArabicNumerals">アラビア数字を使用</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="insertLineBreaks"
              checked={insertLineBreaks}
              onCheckedChange={(checked) => setInsertLineBreaks(checked as boolean)}
            />
            <Label htmlFor="insertLineBreaks">改行を挿入</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="useDoubleLineBreaks"
              checked={useDoubleLineBreaks}
              onCheckedChange={(checked) => setUseDoubleLineBreaks(checked as boolean)}
            />
            <Label htmlFor="useDoubleLineBreaks">二重改行を使用</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showInterimResults"
              checked={showInterimResults}
              onCheckedChange={(checked) => setShowInterimResults(checked as boolean)}
            />
            <Label htmlFor="showInterimResults">中間結果を表示</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="theme">テーマ</Label>
            <Select
              value={theme}
              onValueChange={(value) => setTheme(value)}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">ライト</SelectItem>
                <SelectItem value="dark">ダーク</SelectItem>
                <SelectItem value="system">システム</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="microphone">マイク選択</Label>
          <Select value={selectedMicrophone || undefined} onValueChange={setSelectedMicrophone}>
            <SelectTrigger id="microphone">
              <SelectValue placeholder="マイクを選択" />
            </SelectTrigger>
            <SelectContent>
              {availableMicrophones.map((mic) => (
                <SelectItem key={mic.deviceId} value={mic.deviceId || 'default'}>
                  {mic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="customWords">カスタム単語（カンマ区切り）</Label>
          <Input
            id="customWords"
            value={customWords}
            onChange={(e) => setCustomWords(e.target.value)}
            placeholder="例：AI、機械学習、ニューラルネットワーク"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="numberOfPages">ページ数</Label>
          <Select value={numberOfPages.toString()} onValueChange={(value) => setNumberOfPages(parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select number of pages" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Shortcut Help Section */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-2">Keyboard Shortcuts</h3>
          <ShortcutHelpContent />
        </div>
      </DialogContent>
    </Dialog>
  )
}

