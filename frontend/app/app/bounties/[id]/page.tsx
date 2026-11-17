'use client';

import { useEffect, useState, useRef } from 'react';
import { DUMMY_BOUNTIES } from '@/lib/dummy-data';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, DollarSign, Share2, User, ExternalLink, Zap, Send, CheckCircle, X, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/gsui/Reveal';
import { PanelSkeleton } from '@/components/gsui/Skeleton';

const TABS = ['Details', 'Submissions', 'Comments', 'Winners'] as const;
type Tab = typeof TABS[number];

export default function BountyDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bounty, setBounty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Details');
  
  const [comments, setComments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  const [commentText, setCommentText] = useState('');
  const [posted, setPosted] = useState(false);
  const [posting, setPosting] = useState(false);
  const [proofModalData, setProofModalData] = useState<any>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  const [submitLink, setSubmitLink] = useState('');
  const [submitWallet, setSubmitWallet] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);



  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const bountyRes = await fetch(`/api/bounties/${id}`);
        if (!bountyRes.ok) throw new Error('Bounty not found');
        const { bounty: b } = await bountyRes.json();
        setBounty(b);
        
        const [subsRes, commsRes] = await Promise.all([
          fetch(`/api/bounties/${b.id}/submissions`).then(r => r.json()),
          fetch(`/api/bounties/${b.id}/comments`).then(r => r.json())
        ]);
        
        if (subsRes.submissions) setSubmissions(subsRes.submissions);
        if (commsRes.comments) setComments(commsRes.comments);
      } catch (err) {
        console.error('Failed to load bounty data', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handlePostComment() {
    const trimmed = commentText.trim();
    if (!trimmed || !bounty || posting) return;
    
    setPosting(true);
    try {
      const res = await fetch(`/api/bounties/${bounty.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'You', text: trimmed })
      });
      const data = await res.json();
      if (data.comment) {
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
        setPosted(true);
        setTimeout(() => setPosted(false), 2000);
      }
    } catch (e) {
      console.error('Failed to post comment', e);
    } finally {
      setPosting(false);
    }
  }

  async function handleSubmitWork() {
    if (!submitLink || !submitWallet || !bounty) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/bounties/${bounty.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: submitWallet, submission_url: submitLink, notes: submitNotes })
      });
      const data = await res.json();
      if (data.submission) {
        setSubmissions(prev => [data.submission, ...prev]);
        setIsSubmitModalOpen(false);
        setSubmitLink('');
        setSubmitWallet('');
        setSubmitNotes('');
        setActiveTab('Submissions');
      }
    } catch (e) {
      console.error('Failed to submit work', e);
    } finally {
      setSubmitting(false);
    }
  }



  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <PanelSkeleton />
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="w-full max-w-5xl mx-auto text-center py-20 text-white">
        <h2 className="text-2xl font-bold mb-4">Bounty not found</h2>
        <button onClick={() => router.push('/app/bounties')} className="text-[#00c9a3] hover:underline">
          Go back to bounties
        </button>
      </div>
    );
  }

  const isClosed = bounty.status === 'Closed';

  return (
    <>
      <div className="w-full max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/app/bounties"
          className="inline-flex items-center gap-2 text-sm text-[#6a8090] hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Bounties
        </Link>

        <div className="flex flex-row gap-6 items-start w-full overflow-x-auto min-w-[800px]">

          {/* ── LEFT SIDEBAR (30%) ── */}
          <Reveal className="w-[300px] shrink-0">
            <div className="rounded-2xl border border-[#1a2030] bg-[#0c1018] overflow-hidden shadow-2xl">

              {/* Green header */}
              <div className="bg-[#00c9a3] p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center shrink-0 shadow">
                    <img
                      src={bounty.logo_url}
                      alt={bounty.org_name}
                      className="w-7 h-7"
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </div>
                  <div>
                    <h1 className="font-bold text-black text-[15px] leading-snug">{bounty.title}</h1>
                    <p className="text-xs text-black/70 mt-0.5 flex items-center gap-1">
                      by {bounty.org_name}
                      <span className="px-1.5 py-0.5 bg-black/15 rounded text-[10px] font-medium">Global</span>
                    </p>
                  </div>
                </div>

                <p className="text-sm font-semibold text-black/80 mb-3">
                  Bounty • {submissions.length} Submissions
                </p>

                <div className="flex gap-2">
                  <button 
                    onClick={() => bounty.status === 'Open' && setIsSubmitModalOpen(true)}
                    className={`flex-1 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                      bounty.status === 'Open' 
                        ? 'bg-black text-white hover:bg-[#1a2030]' 
                        : 'bg-black/10 hover:bg-black/20 text-black'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      bounty.status === 'Open' ? 'bg-[#00c9a3]' : 
                      bounty.status === 'In Review' ? 'bg-yellow-400' : 'bg-red-500'
                    }`} />
                    {bounty.status === 'Open' ? 'Submit Work' : 
                     bounty.status === 'In Review' ? 'In Review' : 'Submissions Closed'}
                  </button>
                  <button className="w-10 h-10 bg-black/10 hover:bg-black/20 text-black rounded-lg flex items-center justify-center transition-colors shrink-0">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Time remaining */}
              <div className="p-4 border-b border-[#1a2030]">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-[#6a8090] text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" /> Time Remaining
                  </div>
                  {isClosed && (
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Ended</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {['Days', 'Hours', 'Minutes', 'Seconds'].map(l => (
                    <div key={l} className="bg-[#1a2030] rounded-lg py-2 px-1">
                      <div className="font-mono font-bold text-white text-sm">00</div>
                      <div className="text-[9px] text-[#6a8090] uppercase mt-0.5">{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prize pool */}
              <div className="p-4">
                <div className="bg-[rgba(0,201,163,0.06)] border border-[rgba(0,201,163,0.15)] rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00c9a3] flex items-center justify-center shrink-0 relative">
                    <DollarSign className="w-5 h-5 text-black" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center text-[9px] text-yellow-400">★</span>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#6a8090] uppercase tracking-wide">Total Prize Pool</div>
                    <div className="font-mono font-bold text-2xl text-white leading-none mt-0.5">
                      {bounty.prize_pool.toLocaleString()}{' '}
                      <span className="text-[#00c9a3] text-sm font-semibold underline">VARA</span>
                    </div>
                    <div className="text-[10px] text-[#6a8090] mt-1 italic">
                      *AI Tutor streams ~3.6 VARA per correct answer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* ── RIGHT CONTENT (70%) ── */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <Reveal delay={0.05}>
              <div className="flex bg-[#0c1018] rounded-xl p-1 border border-[#1a2030] overflow-x-auto hide-scrollbar mb-6">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap px-4 ${
                      activeTab === tab
                        ? 'bg-[rgba(0,201,163,0.1)] text-[#00c9a3] shadow-sm'
                        : 'text-[#6a8090] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* ── Details Tab ── */}
            {activeTab === 'Details' && (
              <Reveal delay={0.1}>
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-5">
                    <h3 className="font-semibold text-white mb-2">Short Description</h3>
                    <p className="text-sm text-[#878F83] leading-relaxed">{bounty.short_desc}</p>
                  </div>
                  <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-5">
                    <h3 className="font-semibold text-white mb-3">Deliverables</h3>
                    <ul className="space-y-2">
                      {(bounty.deliverables || []).map((d: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#878F83]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00c9a3] mt-1.5 shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-5">
                    <h3 className="font-semibold text-white mb-3">Eligibility Requirements</h3>
                    <ul className="space-y-2">
                      {(bounty.requirements || []).map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#878F83]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00c9a3] mt-1.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            )}

            {/* ── Submissions Tab ── */}
            {activeTab === 'Submissions' && (
              <Reveal delay={0.1}>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#1a2030] [&::-webkit-scrollbar-thumb]:rounded-full">
                  {submissions.length === 0 ? (
                    <div className="text-center py-8 text-[#6a8090] text-sm">No submissions yet. Be the first!</div>
                  ) : submissions.map((sub, i) => (
                    <div key={i} className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1a2030] flex items-center justify-center text-[#6a8090]">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium font-mono">{sub.wallet_address.substring(0, 6)}...{sub.wallet_address.slice(-4)}</div>
                          <div className="text-[#6a8090] text-xs">{new Date(sub.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setProofModalData(sub)}
                        className="flex items-center gap-1.5 text-[#00c9a3] text-xs hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Proof
                      </button>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {/* ── Comments Tab ── */}
            {activeTab === 'Comments' && (
              <Reveal delay={0.1}>
                <div className="space-y-4">
                  {/* Composer */}
                  <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-4">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1a2030] flex items-center justify-center shrink-0 text-[#6a8090]">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <textarea
                          ref={textareaRef}
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePostComment();
                          }}
                          className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg p-3 text-sm text-white outline-none focus:border-[#00c9a3] resize-none h-24 transition-colors"
                          placeholder="Ask a question or leave a comment... (Ctrl+Enter to post)"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-[#6a8090]">Ctrl+Enter to post</span>
                          <button
                            onClick={handlePostComment}
                            disabled={!commentText.trim() || posting}
                            className="flex items-center gap-2 px-4 py-2 bg-[#00c9a3] text-black text-sm font-semibold rounded-lg hover:bg-[#00a382] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {posting ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                            ) : posted ? (
                              <><CheckCircle className="w-4 h-4" /> Posted!</>
                            ) : (
                              <><Send className="w-4 h-4" /> Post</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comment list */}
                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#1a2030] [&::-webkit-scrollbar-thumb]:rounded-full">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-[#6a8090] text-sm">No comments yet. Start the conversation!</div>
                    ) : comments.map(c => (
                      <div key={c.id} className="rounded-xl border border-[#1a2030] bg-[#0c1018] p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1a2030] flex items-center justify-center shrink-0 text-[#6a8090]">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white text-sm font-medium">{c.author}</span>
                              <span className="text-[#6a8090] text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[#878F83] text-sm leading-relaxed">{c.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* ── Winners Tab ── */}
            {activeTab === 'Winners' && (
              <Reveal delay={0.1}>
                <div className="py-16 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[rgba(0,201,163,0.1)] flex items-center justify-center mb-5">
                    <Zap className="w-8 h-8 text-[#00c9a3]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#00c9a3] mb-2">Victory is near!</h3>
                  <p className="text-[#6a8090] text-sm max-w-xs">
                    Winners will be announced in no time. Stay thrilled!
                  </p>
                </div>
              </Reveal>
            )}


          </div>
        </div>
      </div>

      {/* Proof Modal */}
      {proofModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0c1018] border border-[#1a2030] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#1a2030]">
              <h3 className="font-semibold text-white">Submission Proof</h3>
              <button onClick={() => setProofModalData(null)} className="text-[#6a8090] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1a2030] flex items-center justify-center text-[#6a8090]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-white font-medium font-mono">{proofModalData.wallet_address?.substring(0, 6)}...{proofModalData.wallet_address?.slice(-4)}</div>
                  <div className="text-[#6a8090] text-xs">Submitted {new Date(proofModalData.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#6a8090] uppercase tracking-wider mb-2">X (Twitter) Post Link</label>
                  <a href={proofModalData.submission_url} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-[#080b10] border border-[#1a2030] rounded-lg p-3 hover:border-[#00c9a3] transition-colors group">
                    <span className="text-[#00c9a3] text-sm truncate">{proofModalData.submission_url}</span>
                    <ExternalLink className="w-4 h-4 text-[#6a8090] group-hover:text-[#00c9a3]" />
                  </a>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6a8090] uppercase tracking-wider mb-2">Required Wallet Address</label>
                  <div className="bg-[#080b10] border border-[#1a2030] rounded-lg p-3 text-white text-sm font-mono truncate">
                    {proofModalData.wallet_address}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6a8090] uppercase tracking-wider mb-2">Additional Notes</label>
                  <div className="bg-[#080b10] border border-[#1a2030] rounded-lg p-3 text-sm text-[#878F83] leading-relaxed">
                    {proofModalData.notes || "No additional notes provided."}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#1a2030] bg-[#080b10]/50 flex justify-end">
              <button onClick={() => setProofModalData(null)} className="px-5 py-2 bg-[#1a2030] hover:bg-[#2a3a4a] text-white text-sm font-medium rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0c1018] border border-[#1a2030] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#1a2030]">
              <h3 className="font-semibold text-white">Submit Work</h3>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-[#6a8090] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="bg-[rgba(0,201,163,0.05)] border border-[rgba(0,201,163,0.15)] rounded-lg p-4">
                <h4 className="text-xs font-semibold text-[#00c9a3] uppercase tracking-wider mb-2">Submission Checklist</h4>
                <ul className="space-y-1.5">
                  {(bounty.deliverables || []).map((d: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#878F83]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00c9a3] mt-1 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#6a8090] uppercase tracking-wider mb-2">Proof of Work (Link) *</label>
                  <input 
                    type="url" 
                    value={submitLink}
                    onChange={e => setSubmitLink(e.target.value)}
                    placeholder="https://x.com/your-post..."
                    className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg p-3 text-sm text-white outline-none focus:border-[#00c9a3] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6a8090] uppercase tracking-wider mb-2">Wallet Address (VARA) *</label>
                  <input 
                    type="text" 
                    value={submitWallet}
                    onChange={e => setSubmitWallet(e.target.value)}
                    placeholder="5G..."
                    className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg p-3 text-sm text-white font-mono outline-none focus:border-[#00c9a3] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6a8090] uppercase tracking-wider mb-2">Additional Notes (Optional)</label>
                  <textarea 
                    value={submitNotes}
                    onChange={e => setSubmitNotes(e.target.value)}
                    placeholder="Any extra context for the reviewers..."
                    className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg p-3 text-sm text-white outline-none focus:border-[#00c9a3] resize-none h-24 transition-colors"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#1a2030] bg-[#080b10]/50 flex justify-end gap-3">
              <button onClick={() => setIsSubmitModalOpen(false)} className="px-5 py-2 hover:bg-[#1a2030] text-[#6a8090] hover:text-white text-sm font-medium rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleSubmitWork}
                disabled={submitting || !submitLink || !submitWallet}
                className="px-5 py-2 bg-[#00c9a3] hover:bg-[#00a382] disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Work'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
