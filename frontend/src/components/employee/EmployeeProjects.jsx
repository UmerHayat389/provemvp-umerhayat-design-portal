// src/components/employee/EmployeeProjects.jsx
// Production · Inter · Brand #101828 · Dark/Light · Redesigned Modal
import React, { useState, useEffect, useCallback } from 'react';
import { projectAPI }   from '../../services/api';
import socketService    from '../../services/socketService';
import { toast }        from 'react-toastify';
import {
  Briefcase, X, Clock, CheckCircle, AlertTriangle,
  Calendar, User, FileText, Flag, ListChecks,
  Circle, PlayCircle, Ban, Target, TrendingUp, Users,
} from 'lucide-react';
import { Dialog, IconButton, useMediaQuery, useTheme, Slide, Fade } from '@mui/material';

/* ─── inject Inter font + global styles once ───────────────────────────────── */
(() => {
  if (!document.getElementById('ep-inter')) {
    const l = document.createElement('link');
    l.id = 'ep-inter'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&display=swap';
    document.head.appendChild(l);
  }
  if (!document.getElementById('ep-css')) {
    const s = document.createElement('style'); s.id = 'ep-css';
    s.textContent = `
      @keyframes ep-spin { to { transform:rotate(360deg) } }
      @keyframes ep-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      .ep-body::-webkit-scrollbar { width:4px }
      .ep-body::-webkit-scrollbar-track { background:transparent }
      .ep-body::-webkit-scrollbar-thumb { background:rgba(128,128,128,.2); border-radius:4px }
      .ep-body::-webkit-scrollbar-thumb:hover { background:rgba(128,128,128,.35) }
    `;
    document.head.appendChild(s);
  }
})();

const SlideUp = React.forwardRef((p, r) => <Slide direction="up" ref={r} {...p} />);

/* ─── watch Tailwind .dark on <html> ───────────────────────────────────────── */
function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const ob = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    ob.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);
  return dark;
}

/* ─── data maps ─────────────────────────────────────────────────────────────── */
const ST_MAP = {
  'Completed':    { bar:'#10b981', dBg:'#052e16', dTx:'#34d399', lBg:'#dcfce7', lTx:'#059669' },
  'In Progress':  { bar:'#3b82f6', dBg:'#172554', dTx:'#93c5fd', lBg:'#eff6ff', lTx:'#2563eb' },
  'Not Started':  { bar:'#64748b', dBg:'#1e293b', dTx:'#94a3b8', lBg:'#f1f5f9', lTx:'#64748b' },
  'Delayed':      { bar:'#f43f5e', dBg:'#4c0519', dTx:'#fb7185', lBg:'#fff1f2', lTx:'#e11d48' },
  'On Hold':      { bar:'#f59e0b', dBg:'#451a03', dTx:'#fbbf24', lBg:'#fffbeb', lTx:'#d97706' },
};
const getSt  = (p) => { const k = (p.status !== 'Completed' && new Date() > new Date(p.deadline)) ? 'Delayed' : p.status; return { key: k, ...(ST_MAP[k] || ST_MAP['Not Started']) }; };
const dLeft  = (dl, st) => st === 'Completed' ? null : Math.ceil((new Date(dl) - new Date()) / 86400000);

const TK_MAP = {
  'To Do':      { label:'To Do',       Icon:Circle,      dBg:'#1e293b', dTx:'#94a3b8', lBg:'#f1f5f9', lTx:'#64748b' },
  'In Progress':{ label:'In Progress', Icon:PlayCircle,  dBg:'#172554', dTx:'#93c5fd', lBg:'#eff6ff', lTx:'#2563eb' },
  'Done':       { label:'Done',        Icon:CheckCircle, dBg:'#052e16', dTx:'#34d399', lBg:'#dcfce7', lTx:'#059669' },
  'Blocked':    { label:'Blocked',     Icon:Ban,         dBg:'#4c0519', dTx:'#fb7185', lBg:'#fff1f2', lTx:'#e11d48' },
};
const PR_MAP = {
  'High':  { Icon:AlertTriangle, dBg:'#4c0519', dTx:'#fb7185', dBr:'#9f1239', lBg:'#fff1f2', lTx:'#e11d48', lBr:'#fecdd3' },
  'Medium':{ Icon:Flag,          dBg:'#451a03', dTx:'#fbbf24', dBr:'#92400e', lBg:'#fffbeb', lTx:'#d97706', lBr:'#fde68a' },
  'Low':   { Icon:Target,        dBg:'#052e16', dTx:'#34d399', dBr:'#166534', lBg:'#dcfce7', lTx:'#059669', lBr:'#6ee7b7' },
};
const ACTS = {
  'To Do':      [{ next:'In Progress', label:'Start',    bg:'#2563eb' }],
  'In Progress':[{ next:'Done',        label:'Complete', bg:'#059669' }, { next:'Blocked', label:'Block', bg:'#e11d48' }],
  'Blocked':    [{ next:'In Progress', label:'Resume',   bg:'#2563eb' }],
  'Done':       [{ next:'In Progress', label:'Reopen',   bg:'#64748b' }],
};

/* ─── design tokens ─────────────────────────────────────────────────────────── */
const FF = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";
const tok = (d) => ({
  /* page */
  page:  d ? '#0c1220' : '#f0f2f5',
  /* cards */
  card:  d ? '#121c2e' : '#ffffff',
  cBd:   d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
  cHBd:  d ? '#3b82f6' : '#101828',
  cSh:   d ? '0 12px 40px rgba(0,0,0,.6)' : '0 8px 32px rgba(16,24,40,.1)',
  /* surfaces */
  sf:    d ? '#182035' : '#f8fafc',
  sfBd:  d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
  /* text */
  t1: d ? '#eef2ff' : '#0f172a',
  t2: d ? '#8b97ad' : '#475569',
  t3: d ? '#3e4e65' : '#94a3b8',
  /* track / spinner */
  tr:    d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  sp:    d ? 'rgba(255,255,255,0.12)' : '#e2e8f0',
  /* filter pills */
  pABg:'#101828', pATx:'#fff', pABd:'rgba(59,130,246,0.4)',
  pIBg: d ? 'rgba(255,255,255,0.05)' : '#ffffff',
  pITx: d ? '#6b7280' : '#64748b',
  pIBd: d ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
  /* modal – three-layer system */
  mBg:   d ? '#0d1726' : '#ffffff',       // modal backdrop
  mL1:   d ? '#121c2e' : '#f8fafc',       // layer 1 – header band
  mL2:   d ? '#182035' : '#f1f4f8',       // layer 2 – inner surfaces
  mL3:   d ? '#1e2a42' : '#e9ecf1',       // layer 3 – deepest inset
  mDv:   d ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
  mBd:   d ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.09)',
  mSh:   d ? '0 48px 96px rgba(0,0,0,.92)' : '0 32px 80px rgba(0,0,0,.18)',
  /* close btn */
  xBg:   d ? 'rgba(255,255,255,0.07)' : '#eff1f5',
  xBgH:  d ? 'rgba(255,255,255,0.13)' : '#e2e6ec',
  xTx:   d ? '#6b7280' : '#94a3b8',
  xTxH:  d ? '#eef2ff' : '#0f172a',
});

/* ─── helpers ───────────────────────────────────────────────────────────────── */
const $ = (base, extra) => ({ fontFamily: FF, ...base, ...extra });

/* ════════════════════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, Icon, grad, tk }) => (
  <div style={$(({ background:tk.card, border:`1px solid ${tk.cBd}`, borderRadius:14, padding:'15px 17px' }))}>
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
      <div style={{ width:38, height:38, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:grad, boxShadow:'0 4px 14px rgba(0,0,0,.3)', flexShrink:0 }}>
        <Icon size={17} color="#fff" strokeWidth={2} />
      </div>
      <span style={{ fontSize:26, fontWeight:900, color:tk.t1, letterSpacing:'-1.5px', lineHeight:1 }}>{value}</span>
    </div>
    <p style={{ fontSize:9.5, fontWeight:700, color:tk.t3, textTransform:'uppercase', letterSpacing:'.12em', margin:0 }}>{label}</p>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════
   TASK ROW  (inside modal)
══════════════════════════════════════════════════════════════════════════════ */
const TaskRow = ({ task, pid, onUpd, busy, tk, d }) => {
  const cfg = TK_MAP[task.status] || TK_MAP['To Do'];
  const pr  = PR_MAP[task.priority] || PR_MAP['Low'];
  const sBg = d ? cfg.dBg : cfg.lBg, sTx = d ? cfg.dTx : cfg.lTx;
  const pBg = d ? pr.dBg  : pr.lBg,  pTx = d ? pr.dTx  : pr.lTx, pBd = d ? pr.dBr : pr.lBr;
  const PI  = pr.Icon;

  return (
    <div style={$(({ background:tk.mL2, border:`1px solid ${tk.mDv}`, borderRadius:10, padding:'10px 13px', transition:'border-color .15s' }))}>
      {/* title row */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <div style={{ width:22, height:22, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:sBg }}>
          <cfg.Icon size={12} style={{ color:sTx }} strokeWidth={2.2} />
        </div>
        <span style={{ fontFamily:FF, fontSize:12.5, fontWeight:600, color:tk.t1, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {task.title}
        </span>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          {(ACTS[task.status] || []).map(a => (
            <button key={a.next} disabled={busy}
              onClick={e => { e.stopPropagation(); onUpd(pid, task._id, a.next); }}
              style={{ fontFamily:FF, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:6, color:'#fff', background:a.bg, border:'none', cursor:busy?'not-allowed':'pointer', opacity:busy?.4:1, letterSpacing:'.02em', transition:'opacity .15s' }}>
              {busy ? '…' : a.label}
            </button>
          ))}
        </div>
      </div>
      {/* meta row */}
      <div style={{ display:'flex', alignItems:'center', gap:5, paddingLeft:30 }}>
        {task.priority && (
          <span style={{ fontFamily:FF, display:'flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:5, fontSize:9.5, fontWeight:600, background:pBg, color:pTx, border:`1px solid ${pBd}` }}>
            <PI size={8} strokeWidth={2.5} />{task.priority}
          </span>
        )}
        {task.deadline && (
          <span style={{ fontFamily:FF, display:'flex', alignItems:'center', gap:3, fontSize:9.5, color:tk.t2, fontWeight:500 }}>
            <Calendar size={9} strokeWidth={2} />
            {new Date(task.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
          </span>
        )}
        <span style={{ fontFamily:FF, marginLeft:'auto', fontSize:9.5, fontWeight:600, padding:'2px 7px', borderRadius:5, background:sBg, color:sTx }}>
          {cfg.label}
        </span>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   PROJECT CARD  (list view)
══════════════════════════════════════════════════════════════════════════════ */
const ProjCard = ({ p, onOpen, tk, d }) => {
  const st    = getSt(p);
  const dl    = dLeft(p.deadline, p.status);
  const tasks = p.myMember?.tasks || [];
  const done  = tasks.filter(x => x.status === 'Done').length;
  const pct   = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const dlLbl = p.status === 'Completed' ? 'Completed' : dl === null ? '—' : dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d left`;
  const dlClr = p.status === 'Completed' ? '#10b981' : dl !== null && dl < 0 ? '#f43f5e' : dl !== null && dl <= 2 ? '#f59e0b' : tk.t3;
  const sBg   = d ? st.dBg : st.lBg, sTx = d ? st.dTx : st.lTx;

  return (
    <div onClick={() => onOpen(p)}
      style={$(({ background:tk.card, border:`1px solid ${tk.cBd}`, borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'all .2s' }))}
      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor=tk.cHBd; el.style.transform='translateY(-2px)'; el.style.boxShadow=tk.cSh; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor=tk.cBd;  el.style.transform='none';             el.style.boxShadow='none'; }}
    >
      <div style={{ height:3, background:st.bar }} />
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:5 }}>
          <h3 style={{ fontFamily:FF, fontSize:13.5, fontWeight:700, color:tk.t1, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, letterSpacing:'-0.2px' }}>{p.title}</h3>
          <span style={{ fontFamily:FF, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, flexShrink:0, background:sBg, color:sTx }}>{st.key}</span>
        </div>
        {p.description && (
          <p style={{ fontFamily:FF, fontSize:11.5, color:tk.t2, margin:'0 0 11px', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {p.description}
          </p>
        )}
        <div style={{ marginBottom:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontFamily:FF, fontSize:10.5, color:tk.t3, fontWeight:500 }}>{done}/{tasks.length} tasks</span>
            <span style={{ fontFamily:FF, fontSize:11, fontWeight:800, color:tk.t1 }}>{pct}%</span>
          </div>
          <div style={{ height:4, borderRadius:3, background:tk.tr, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:st.bar, borderRadius:3, transition:'width .4s ease' }} />
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:11, borderTop:`1px solid ${tk.cBd}` }}>
          <span style={{ fontFamily:FF, display:'flex', alignItems:'center', gap:4, fontSize:11, color:tk.t3, fontWeight:500 }}>
            <User size={11} strokeWidth={2} />{p.members?.length || 0} members
          </span>
          <span style={{ fontFamily:FF, display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:6, color:dlClr, background:`${dlClr}15` }}>
            <Clock size={10} strokeWidth={2} />{dlLbl}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MODAL  — completely redesigned
══════════════════════════════════════════════════════════════════════════════ */
const Modal = ({ p, onClose, onUpd, busyId, tk, d }) => {
  const st    = getSt(p);
  const tasks = p.myMember?.tasks || [];
  const done  = tasks.filter(x => x.status === 'Done').length;
  const pct   = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const dl    = dLeft(p.deadline, p.status);
  const muiTh = useTheme();
  const mob   = useMediaQuery(muiTh.breakpoints.down('sm'));
  const pr    = PR_MAP[p.priority] || PR_MAP['Medium'];
  const PI    = pr.Icon;

  const dlLbl = dl === null ? null : dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? 'Due today' : `${dl}d left`;
  const dlClr = dl === null ? tk.t3 : dl < 0 ? '#f43f5e' : dl <= 2 ? '#f59e0b' : '#10b981';
  const sBg   = d ? st.dBg : st.lBg, sTx = d ? st.dTx : st.lTx;
  const pBg   = d ? pr.dBg : pr.lBg, pTx = d ? pr.dTx : pr.lTx, pBd = d ? pr.dBr : pr.lBr;

  const px = mob ? 16 : 20; // horizontal padding

  return (
    <Dialog
      open={!!p}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={mob}
      TransitionComponent={SlideUp}
      PaperProps={{ sx: {
        fontFamily: FF,
        borderRadius: mob ? 0 : '20px',
        bgcolor: tk.mBg,
        backgroundImage: 'none',
        border: `1px solid ${tk.mBd}`,
        boxShadow: tk.mSh,
        m: mob ? 0 : '14px',
        maxHeight: mob ? '100%' : '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}}
    >

      {/* ══ TOP ACCENT LINE ══ */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${st.bar}, ${st.bar}80)`, flexShrink: 0 }} />

      {/* ══════════════════════════════
          HEADER BAND  (fixed, no scroll)
      ══════════════════════════════ */}
      <div style={{ background: tk.mL1, padding: `18px ${px}px 16px`, borderBottom:`1px solid ${tk.mDv}`, flexShrink: 0 }}>

        {/* row: title + close */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:12 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontFamily:FF, fontSize:10, fontWeight:700, color:tk.t3, textTransform:'uppercase', letterSpacing:'.12em', margin:'0 0 5px' }}>
              Project Details
            </p>
            <h2 style={{ fontFamily:FF, fontSize:16, fontWeight:800, color:tk.t1, margin:0, lineHeight:1.3, letterSpacing:'-0.3px', wordBreak:'break-word' }}>
              {p.title}
            </h2>
          </div>
          <IconButton onClick={onClose} size="small" sx={{
            width:30, height:30, flexShrink:0, mt:'2px',
            bgcolor:tk.xBg, color:tk.xTx,
            '&:hover':{ bgcolor:tk.xBgH, color:tk.xTxH },
            transition:'all .15s',
          }}>
            <X size={14} strokeWidth={2.5} />
          </IconButton>
        </div>

        {/* status + deadline pills */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:14 }}>
          <span style={{ fontFamily:FF, fontSize:10.5, fontWeight:700, padding:'4px 11px', borderRadius:20, background:sBg, color:sTx, letterSpacing:'.02em' }}>
            {st.key}
          </span>
          {dlLbl && (
            <span style={{ fontFamily:FF, display:'flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:600, color:dlClr, background:`${dlClr}1a`, padding:'4px 10px', borderRadius:20 }}>
              <Clock size={9} strokeWidth={2.5} />{dlLbl}
            </span>
          )}
        </div>

        {/* ── PROGRESS BAR BLOCK ── */}
        <div style={{ background:tk.mL2, border:`1px solid ${tk.mDv}`, borderRadius:12, padding:'13px 14px' }}>
          {/* bar label row */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <TrendingUp size={12} style={{ color:st.bar }} strokeWidth={2.5} />
              <span style={{ fontFamily:FF, fontSize:11, fontWeight:600, color:tk.t2 }}>Progress</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:3 }}>
              <span style={{ fontFamily:FF, fontSize:22, fontWeight:900, color:tk.t1, letterSpacing:'-1px', lineHeight:1 }}>{pct}</span>
              <span style={{ fontFamily:FF, fontSize:11, fontWeight:700, color:tk.t2 }}>%</span>
            </div>
          </div>
          {/* bar track */}
          <div style={{ height:6, borderRadius:3, background:tk.tr, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${st.bar}, ${st.bar}cc)`, borderRadius:3, transition:'width .6s cubic-bezier(.4,0,.2,1)' }} />
          </div>
          {/* done / remaining */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontFamily:FF, fontSize:10, color:tk.t2, fontWeight:500 }}>{done} of {tasks.length} done</span>
            {tasks.length - done > 0 && <span style={{ fontFamily:FF, fontSize:10, color:tk.t3, fontWeight:500 }}>{tasks.length - done} remaining</span>}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════ */}
      <div className="ep-body" style={{ overflowY:'auto', flex:1, background:tk.mBg }}>
        <div style={{ padding:`16px ${px}px 0` }}>

          {/* ── META ROW  (3 tiles) ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, marginBottom:12 }}>

            {/* Priority tile */}
            <div style={{ background:tk.mL1, border:`1px solid ${tk.mDv}`, borderRadius:11, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:6 }}>
                <PI size={10} style={{ color: pTx }} strokeWidth={2.5} />
                <span style={{ fontFamily:FF, fontSize:9, fontWeight:700, color:tk.t3, textTransform:'uppercase', letterSpacing:'.1em' }}>Priority</span>
              </div>
              <span style={{ fontFamily:FF, display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:700, padding:'3px 9px', borderRadius:6, background:pBg, color:pTx, border:`1px solid ${pBd}` }}>
                {p.priority || 'Medium'}
              </span>
            </div>

            {/* Deadline tile */}
            <div style={{ background:tk.mL1, border:`1px solid ${tk.mDv}`, borderRadius:11, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:6 }}>
                <Calendar size={10} style={{ color:'#60a5fa' }} strokeWidth={2} />
                <span style={{ fontFamily:FF, fontSize:9, fontWeight:700, color:tk.t3, textTransform:'uppercase', letterSpacing:'.1em' }}>Deadline</span>
              </div>
              <span style={{ fontFamily:FF, fontSize:12, fontWeight:700, color:tk.t1 }}>
                {new Date(p.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'2-digit' })}
              </span>
            </div>

            {/* Team tile */}
            <div style={{ background:tk.mL1, border:`1px solid ${tk.mDv}`, borderRadius:11, padding:'10px 12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:6 }}>
                <Users size={10} style={{ color:'#a78bfa' }} strokeWidth={2} />
                <span style={{ fontFamily:FF, fontSize:9, fontWeight:700, color:tk.t3, textTransform:'uppercase', letterSpacing:'.1em' }}>Team</span>
              </div>
              <span style={{ fontFamily:FF, fontSize:12, fontWeight:700, color:tk.t1 }}>
                {p.members?.length || 0} <span style={{ fontSize:10, fontWeight:500, color:tk.t2 }}>members</span>
              </span>
            </div>
          </div>

          {/* ── DESCRIPTION ── */}
          {p.description && (
            <div style={{ background:tk.mL1, border:`1px solid ${tk.mDv}`, borderRadius:11, padding:'12px 14px', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
                <FileText size={11} strokeWidth={2} style={{ color:tk.t3 }} />
                <span style={{ fontFamily:FF, fontSize:9, fontWeight:700, color:tk.t3, textTransform:'uppercase', letterSpacing:'.1em' }}>About this project</span>
              </div>
              <p style={{ fontFamily:FF, fontSize:12.5, color:tk.t2, margin:0, lineHeight:1.75, fontWeight:400 }}>{p.description}</p>
            </div>
          )}

          {/* ── TASKS SECTION ── */}
          <div style={{ marginBottom:16 }}>

            {/* tasks header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <ListChecks size={14} style={{ color:st.bar }} strokeWidth={2.2} />
                <span style={{ fontFamily:FF, fontSize:13, fontWeight:700, color:tk.t1, letterSpacing:'-0.1px' }}>My Tasks</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                {done > 0 && (
                  <span style={{ fontFamily:FF, fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, background: d?'#052e16':'#dcfce7', color: d?'#34d399':'#059669' }}>
                    {done} done
                  </span>
                )}
                <span style={{ fontFamily:FF, fontSize:10, fontWeight:600, padding:'2px 9px', borderRadius:20, background:tk.mL1, color:tk.t3, border:`1px solid ${tk.mDv}` }}>
                  {tasks.length} total
                </span>
              </div>
            </div>

            {/* tasks list */}
            {tasks.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 0', background:tk.mL1, borderRadius:12, border:`1.5px dashed ${tk.mDv}` }}>
                <div style={{ width:40, height:40, borderRadius:12, background:tk.mL2, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                  <ListChecks size={20} style={{ color:tk.t3 }} strokeWidth={1.5} />
                </div>
                <p style={{ fontFamily:FF, fontSize:13, fontWeight:600, color:tk.t2, margin:'0 0 3px' }}>No tasks assigned</p>
                <p style={{ fontFamily:FF, fontSize:11, color:tk.t3, margin:0 }}>Tasks will appear here when assigned to you</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {tasks.map((task, i) => (
                  <Fade in key={task._id} timeout={60 + i * 18}>
                    <div>
                      <TaskRow task={task} pid={p._id} onUpd={onUpd} busy={busyId === task._id} tk={tk} d={d} />
                    </div>
                  </Fade>
                ))}
              </div>
            )}
          </div>

        </div>{/* /padding wrapper */}
      </div>{/* /scrollable body */}

      {/* ══════════════════════════════
          STICKY FOOTER
      ══════════════════════════════ */}
      <div style={{ background:tk.mL1, borderTop:`1px solid ${tk.mDv}`, padding:`12px ${px}px`, flexShrink:0 }}>
        <button
          onClick={onClose}
          style={{ fontFamily:FF, width:'100%', fontSize:13, fontWeight:700, padding:'10px', borderRadius:11, background:'#101828', color:'#ffffff', border:'1.5px solid rgba(255,255,255,0.08)', cursor:'pointer', letterSpacing:'.02em', transition:'background .15s, transform .1s' }}
          onMouseEnter={e => { e.currentTarget.style.background='#1a2e4a'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#101828'; }}
          onMouseDown={e  => { e.currentTarget.style.transform='scale(.99)'; }}
          onMouseUp={e    => { e.currentTarget.style.transform='scale(1)'; }}
        >
          Close
        </button>
      </div>

    </Dialog>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   MAIN  PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function EmployeeProjects({ user }) {
  const [projects, setProjects] = useState([]);
  const [stats,    setStats]    = useState({});
  const [loading,  setLoading]  = useState(true);
  const [detail,   setDetail]   = useState(null);
  const [busyId,   setBusyId]   = useState(null);
  const [filter,   setFilter]   = useState('All');

  const d  = useDark();
  const tk = tok(d);

  const load = useCallback(async () => {
    try {
      const [pR, sR] = await Promise.all([projectAPI.getMyProjects(), projectAPI.getMyProjectStats()]);
      setProjects(pR.data.projects);
      setStats(sR.data.stats);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const sk = socketService.getSocket();
    if (sk) { sk.on('project:assigned', load); sk.on('project:updated', load); sk.on('project:deleted', load); }
    return () => { if (sk) { sk.off('project:assigned', load); sk.off('project:updated', load); sk.off('project:deleted', load); } };
  }, [load]);

  const onUpd = async (pid, tid, ns) => {
    setBusyId(tid);
    try {
      await projectAPI.updateTaskStatus(pid, tid, ns);
      toast.success(`Task updated to ${ns}`);
      const [pR, sR] = await Promise.all([projectAPI.getMyProjects(), projectAPI.getMyProjectStats()]);
      const fr = pR.data.projects;
      setProjects(fr); setStats(sR.data.stats);
      if (detail?._id === pid) { const fp = fr.find(x => x._id === pid); if (fp) setDetail(fp); }
    } catch (e) { toast.error(e?.response?.data?.message || 'Update failed'); }
    finally { setBusyId(null); }
  };

  const STAT_CFG = [
    { label:'Total',       key:'total',      Icon:Briefcase,    grad:'linear-gradient(135deg,#101828,#1d3461)' },
    { label:'Completed',   key:'completed',  Icon:CheckCircle,  grad:'linear-gradient(135deg,#065f46,#059669)' },
    { label:'In Progress', key:'inProgress', Icon:Clock,        grad:'linear-gradient(135deg,#1e3a8a,#2563eb)' },
    { label:'Delayed',     key:'delayed',    Icon:AlertTriangle,grad:'linear-gradient(135deg,#881337,#f43f5e)' },
  ];

  const FILTERS = ['All','Not Started','In Progress','Completed','Delayed'];
  const isD     = (p) => p.status !== 'Completed' && new Date() > new Date(p.deadline);
  const filt    = filter === 'All' ? projects : filter === 'Delayed' ? projects.filter(isD) : projects.filter(p => p.status === filter);

  /* loading */
  if (loading) return (
    <div style={$(({ minHeight:'100vh', background:tk.page, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }))}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:`2.5px solid ${tk.sp}`, borderTopColor:'#101828', animation:'ep-spin .75s linear infinite' }} />
      <p style={{ fontFamily:FF, fontSize:12, color:tk.t3, margin:0, fontWeight:500 }}>Loading projects…</p>
    </div>
  );

  return (
    <div style={$(({ minHeight:'100vh', background:tk.page, padding:'22px 24px', transition:'background .25s' }))}>

      {/* ── page header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:13, marginBottom:22 }}>
        <div style={{ width:42, height:42, borderRadius:13, flexShrink:0, background:'linear-gradient(135deg,#101828,#1d3461)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(16,24,40,.4)' }}>
          <Briefcase size={19} color="#fff" strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontFamily:FF, fontSize:20, fontWeight:900, color:tk.t1, margin:0, lineHeight:1, letterSpacing:'-0.5px' }}>My Projects</h1>
          <p style={{ fontFamily:FF, fontSize:11.5, color:tk.t3, margin:'4px 0 0', fontWeight:500 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} assigned
          </p>
        </div>
      </div>

      {/* ── stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:22 }}>
        {STAT_CFG.map(s => <StatCard key={s.key} label={s.label} value={stats[s.key] || 0} Icon={s.Icon} grad={s.grad} tk={tk} />)}
      </div>

      {/* ── filter pills ── */}
      {projects.length > 0 && (
        <div style={{ display:'flex', gap:6, marginBottom:18, overflowX:'auto', paddingBottom:2 }}>
          {FILTERS.map(tab => {
            const cnt = tab === 'All' ? projects.length : tab === 'Delayed' ? projects.filter(isD).length : projects.filter(p => p.status === tab).length;
            const act = filter === tab;
            return (
              <button key={tab} onClick={() => setFilter(tab)} style={{ fontFamily:FF, padding:'5px 13px', borderRadius:8, fontSize:11.5, fontWeight:600, whiteSpace:'nowrap', cursor:'pointer', transition:'all .15s', background:act?tk.pABg:tk.pIBg, color:act?tk.pATx:tk.pITx, border:`1px solid ${act?tk.pABd:tk.pIBd}`, letterSpacing:'.01em' }}>
                {tab}{cnt > 0 && tab !== 'All' ? ` · ${cnt}` : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* ── project grid / empty state ── */}
      {filt.length === 0 ? (
        <div style={{ textAlign:'center', padding:'72px 0' }}>
          <div style={{ width:52, height:52, borderRadius:16, background:tk.card, border:`1px solid ${tk.cBd}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Briefcase size={22} style={{ color:tk.t3 }} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontFamily:FF, fontSize:15, fontWeight:700, color:tk.t1, margin:'0 0 6px', letterSpacing:'-0.2px' }}>
            {projects.length === 0 ? 'No Projects Yet' : `No ${filter} Projects`}
          </h3>
          <p style={{ fontFamily:FF, fontSize:12.5, color:tk.t2, margin:0, maxWidth:290, marginLeft:'auto', marginRight:'auto', lineHeight:1.65 }}>
            {projects.length === 0 ? 'Projects assigned to you will appear here.' : 'Try selecting a different filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:11 }}>
          {filt.map((p, i) => (
            <Fade in key={p._id} timeout={120 + i * 28}>
              <div><ProjCard p={p} onOpen={setDetail} tk={tk} d={d} /></div>
            </Fade>
          ))}
        </div>
      )}

      {/* ── modal ── */}
      {detail && <Modal p={detail} onClose={() => setDetail(null)} onUpd={onUpd} busyId={busyId} tk={tk} d={d} />}
    </div>
  );
}