'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { ChatMessage } from '@/lib/types/ai';
import { formatTimeAgo } from '@/lib/utils/format';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Namaste! I\'m Sahayog Saathi, your AI assistant. How can I help you today?',
      timestamp: new Date(),
      language: 'EN',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<'EN' | 'HI' | 'MR'>('EN')
  const { user } = useAuth()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      language,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response with mock data
    setTimeout(() => {
      const aiResponses: Record<string, string> = {
        EN: 'Thank you for your question. I\'m analyzing your cooperative data to provide the best answer. Would you like me to help with loan details, savings information, or compliance queries?',
        HI: 'आपके प्रश्न के लिए धन्यवाद। मैं आपके सहकारी डेटा का विश्लेषण कर रहा हूं। क्या आप ऋण, बचत या अनुपालन की जानकारी चाहते हैं?',
        MR: 'आपल्या प्रश्नासाठी धन्यवाद. मी आपल्या सहकारी डेटाचे विश्लेषण करत आहे. तुम्हाला कर्जे, बचत किंवा अनुपालनाची माहिती हवी आहे का?',
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponses[language],
        timestamp: new Date(),
        language,
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-40 w-96 h-[500px] shadow-2xl flex flex-col border border-border/50">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between rounded-t-lg">
            <div>
              <h3 className="font-semibold">Sahayog Saathi</h3>
              <p className="text-xs text-primary-foreground/80">Powered by AI ✦</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary-foreground/20 p-1 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex gap-2 px-4 py-2 border-b border-border bg-muted/30">
            {['EN', 'हि', 'मर'].map((lang, idx) => {
              const langKey = ['EN', 'HI', 'MR'][idx] as 'EN' | 'HI' | 'MR'
              return (
                <button
                  key={lang}
                  onClick={() => setLanguage(langKey)}
                  className={`text-xs px-3 py-1 rounded transition ${
                    language === langKey
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {lang}
                </button>
              )
            })}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  }`}
                >
                  {msg.content}
                  <p className="text-xs mt-1 opacity-70">
                    {formatTimeAgo(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-muted-foreground">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            <div ref={scrollRef} />
          </ScrollArea>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              className="text-sm"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  )
}
