import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader } from 'lucide-react';

const FAQ = [
  { q: 'How do I register for a semester?', a: 'Go to your Student Dashboard → Complete Personal Info → Select Subjects → Submit Fee Payment → Wait for verification and faculty approval.' },
  { q: 'What is the maximum credit limit?', a: 'You can register for a maximum of 32 credits per semester, including any backlog courses.' },
  { q: 'What fees do I need to pay?', a: 'Academic Fee: ₹93,000 (Tuition 72K + Library 2K + Exam 1.5K + Registration 1K + Internet 2K + Medical 1.5K + Cultural 1K + Hostel Room 12K)\nMess Fee: ₹18,000' },
  { q: 'How do I download my fee receipt?', a: 'After submitting payment details, go to Student Portal → Receipts → Click "Generate Receipt" for Academic or Mess fee → Download PDF.' },
  { q: 'What is a UTR number?', a: 'UTR (Unique Transaction Reference) is a 12-digit number provided by your bank after completing an online payment. Check your bank app or statement.' },
  { q: 'How long does verification take?', a: 'Payment verification typically takes 1-2 working days. Faculty approval follows within 1-3 days thereafter.' },
  { q: 'What is ABC ID?', a: 'ABC ID (Academic Bank of Credits) is your unique academic credit identifier issued by the National Academic Depository.' },
  { q: 'My payment was rejected, what do I do?', a: 'Contact the Accounts Section with your UTR number and bank statement. Re-submit correct payment details through the portal.' },
  { q: 'Can I change subjects after selection?', a: 'Yes, you can update your subject selection as long as your registration status is in "Draft" or before faculty approval.' },
  { q: 'What documents do I need to upload?', a: 'Aadhar card, previous semester marksheet, fee payment screenshot/receipt, and any other documents as specified by the academic section.' },
];

function findAnswer(question) {
  const q = question.toLowerCase();
  for (const faq of FAQ) {
    const keywords = faq.q.toLowerCase().split(' ').filter(w => w.length > 3);
    if (keywords.some(k => q.includes(k))) return faq.a;
  }
  return null;
}

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! 👋 I\'m your ABV-IIITM Registration Assistant. Ask me about fees, subjects, deadlines, or any registration queries!' }
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    const userMsg = text;
    setInput('');
    setMessages(m => [...m, { from: 'user', text: userMsg }]);
    setThinking(true);

    await new Promise(r => setTimeout(r, 600));

    const answer = findAnswer(userMsg);
    const response = answer || `For "${userMsg}", please contact:\n📧 accounts@iiitm.ac.in\n📞 0751-2449704\nor visit the Academic Section during office hours (9 AM - 5 PM, Mon-Sat).`;

    setMessages(m => [...m, { from: 'bot', text: response }]);
    setThinking(false);
  };

  const quickQuestions = ['Fee breakdown?', 'Credit limit?', 'Download receipt?', 'Deadline?'];

  return (
    <>
      {/* Chat Button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
        {!open && <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up"
          style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Registration Assistant</p>
              <p className="text-blue-200 text-xs">ABV-IIITM Help Bot</p>
            </div>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ background: '#0f172a', minHeight: '250px', maxHeight: '300px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line"
                  style={{ background: msg.from === 'user' ? 'linear-gradient(135deg, #1d4ed8, #7c3aed)' : 'rgba(255,255,255,0.07)', color: '#e2e8f0' }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-xs flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                  <Loader size={12} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-3 py-2 flex gap-1.5 flex-wrap" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {quickQuestions.map(q => (
              <button key={q} onClick={() => sendMessage(q)} className="text-xs px-2 py-1 rounded-full transition-all hover:bg-blue-600/40"
                style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.3)', color: '#93c5fd' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <input type="text" className="form-input text-xs py-2 flex-1" placeholder="Ask anything about registration..."
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <button onClick={() => sendMessage()} className="p-2 rounded-lg transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1d4ed8, #7c3aed)' }}>
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
