import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThemeLang } from "./ThemeLangContext";
import { runChat } from "@/lib/audit-api";

type Msg = { role: "user" | "ai"; text: string };

const seed: Msg[] = [
  { role: "ai", text: "Hi — I'm AuditAI. Ask me about any flagged transaction or risk pattern." },
];

export function ChatAssistant() {
  const { t } = useThemeLang();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setSending(true);
    try {
      const reply = await runChat(q);
      setMsgs((m) => [...m, { role: "ai", text: reply || "I could not generate a response right now." }]);
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "AuditAI is unavailable right now. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground grid place-items-center glow-primary"
        aria-label="Open AI assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="fixed bottom-6 right-6 z-50 w-[min(380px,calc(100vw-2rem))] h-[520px] glass-card rounded-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">AuditAI Assistant</div>
                  <div className="text-[10px] text-success flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> online
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-3">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] text-sm rounded-2xl px-3 py-2 ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t.askAi}
                className="bg-secondary/50"
              />
              <Button size="icon" onClick={send} disabled={sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
