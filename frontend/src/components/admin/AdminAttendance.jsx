// src/components/admin/AdminAttendance.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { attendanceAPI, userAPI } from "../../services/api";
import { toast, ToastContainer } from "react-toastify";
import {
  FiArrowLeft, FiRefreshCw, FiSearch, FiCalendar,
  FiClock, FiUserX, FiX, FiLogIn, FiLogOut,
  FiShield, FiAlertCircle, FiChevronRight, FiUser,
  FiEdit3, FiChevronDown, FiMail, FiBriefcase,
  FiCheckCircle, FiXCircle, FiMinusCircle, FiAlertTriangle,
} from "react-icons/fi";
import { BsCalendarCheck } from "react-icons/bs";

if (typeof document !== "undefined" && !document.getElementById("att-fonts")) {
  const l = document.createElement("link");
  l.id = "att-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
}

const P  = "#0C2B4E";
const P2 = "#1a4d7a";
const ff = "'DM Sans', system-ui, sans-serif";

/* ─────────────── TOASTS ─────────────── */
const mkToast = (bg, shadow) => ({
  style: {
    fontFamily: ff, fontSize: 13, fontWeight: 600,
    borderRadius: 14, background: bg, color: "#fff",
    padding: "13px 18px", boxShadow: shadow,
    border: "none", minWidth: 280,
  },
  progressStyle: { background: "rgba(255,255,255,.30)", height: 3 },
  iconTheme: { primary: "#fff", secondary: bg },
  duration: 4500,
});
const tSuccess = m => toast.success(m, mkToast(P,            `0 12px 32px rgba(12,43,78,.55)`));
const tError   = m => toast.error  (m, mkToast("#c0392b",    `0 12px 32px rgba(192,57,43,.55)`));
const tInfo    = m => toast.info   (m, mkToast("#1a5276",    `0 12px 32px rgba(26,82,118,.55)`));

/* ─────────────── STATUS TOKENS ─────────────── */
const ST = {
  Present: { s:"#16a34a", ds:"#021a09", ls:"#f0fdf4", db:"#14532d", lb:"#86efac", dn:"#4ade80", ln:"#15803d" },
  Absent:  { s:"#dc2626", ds:"#1a0303", ls:"#fff5f5", db:"#7f1d1d", lb:"#fca5a5", dn:"#f87171", ln:"#b91c1c" },
  Leave:   { s:"#d97706", ds:"#1a1002", ls:"#fffbeb", db:"#78350f", lb:"#fcd34d", dn:"#fbbf24", ln:"#b45309" },
};

/* ─────────────── UTILS ─────────────── */
const pad      = n => String(n).padStart(2,"0");
const toDS     = d => { const t=new Date(d); return `${t.getFullYear()}-${pad(t.getMonth()+1)}-${pad(t.getDate())}`; };
const getTDS   = () => toDS(new Date());
const slug     = (n="") => n.toLowerCase().replace(/\s+/g,"-");
const fmtT     = iso => iso ? new Date(iso).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—";
const fmtShort = ds  => { const [y,m,d]=ds.split("-"); return new Date(+y,+m-1,+d).toLocaleDateString([],{weekday:"short",day:"numeric",month:"short"}); };
const fmtFull  = ds  => { const [y,m,d]=ds.split("-"); return new Date(+y,+m-1,+d).toLocaleDateString([],{weekday:"long",day:"numeric",month:"long",year:"numeric"}); };
const getJoin  = emp => { const r=emp?.joiningDate||emp?.createdAt; if(!r) return null; const d=new Date(r); d.setHours(0,0,0,0); return d; };
const DNAMES   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS    = Array.from({length:5},(_,i)=>new Date().getFullYear()-i);

function buildAbsent(allR,emp,yr,mo) {
  if(!emp) return [];
  const jd=getJoin(emp), tDS=getTDS(), dim=new Date(yr,mo+1,0).getDate();
  const ex=new Set(allR.filter(r=>r.userId?._id===emp._id||r.userId===emp._id).map(r=>toDS(r.date)));
  const out=[];
  for(let day=1;day<=dim;day++){
    const d=new Date(yr,mo,day), ds=toDS(d);
    if(d.getDay()===0||d.getDay()===6) continue;
    if(ds>=tDS) continue;
    if(jd&&d<jd) continue;
    if(!ex.has(ds)) out.push({_syn:true,userId:{_id:emp._id},date:ds,status:"Absent",clockIn:null,clockOut:null,totalHours:0,markedByAdmin:false});
  }
  return out;
}

/* ══════════════════════════════════════════
   CALENDAR GRID  — full dark/light contrast
══════════════════════════════════════════ */
function CalGrid({ year, month, statusMap, onDateClick, onBeforeJoin, joinDate, dark }) {
  const tDS=getTDS();
  const firstDay=new Date(year,month,1).getDay();
  const daysInM=new Date(year,month+1,0).getDate();
  const cells=[];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInM;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);

  const tk = dark ? {
    wrap:    "#0a1520",
    hdrWknd: "#5a8cb0",   hdrWeek: "#3a6080",
    dBg:     "#101e2e",   dBd:  "#1c3550",  dNum:  "#cce0f0",
    wkBg:    "#0d1a28",   wkBd: "#183045",  wkNum: "#7aacc8",
    fuBg:    "#0b1824",   fuBd: "#162c42",  fuNum: "#5a8cb0",
    dimBg:   "#080e18",   dimBd:"#101a28",  dimNum:"#223040",
    subWk:   "#4a7898",   subFu:"#3a6070",  dot:"#243a50",
  } : {
    wrap:    "#e4edf7",
    hdrWknd: "#6a8aaa",   hdrWeek: "#7a96b0",
    dBg:     "#ffffff",   dBd:  "#b0cce0",  dNum:  "#12304a",
    wkBg:    "#edf4fb",   wkBd: "#bedaee",  wkNum: "#7090aa",
    fuBg:    "#f2f7fc",   fuBd: "#c8dcea",  fuNum: "#8aaac0",
    dimBg:   "#eff5fa",   dimBd:"#cddcea",  dimNum:"#98b4c8",
    subWk:   "#8aaac0",   subFu:"#98b4c8",  dot:"#b8ccda",
  };

  return (
    <div style={{fontFamily:ff,background:tk.wrap,borderRadius:16,padding:"14px 8px 10px",userSelect:"none"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
        {DNAMES.map((d,i)=>(
          <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:800,letterSpacing:".06em",
            textTransform:"uppercase",paddingBottom:4,
            color:(i===0||i===6)?tk.hdrWknd:tk.hdrWeek}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((day,idx)=>{
          if(day===null) return <div key={`p${idx}`} style={{minHeight:62,borderRadius:10}}/>;
          const ds=`${year}-${pad(month+1)}-${pad(day)}`;
          const isToday=ds===tDS, isFut=ds>tDS;
          const dow=new Date(year,month,day).getDay(), isWknd=dow===0||dow===6;
          const dObj=new Date(year,month,day), isBef=joinDate?dObj<joinDate:false;
          const status=statusMap[ds];
          let bg,bd,numCol,icon=null,iconCol=null;

          // Handle status first - this is the FIX
          if(status==="Present"){
            bg=dark?ST.Present.ds:ST.Present.ls;
            bd=dark?ST.Present.db:ST.Present.lb;
            numCol=dark?ST.Present.dn:ST.Present.ln;
            icon="p";
            iconCol=ST.Present.s;
            // If it's today AND present, make border more prominent
            if(isToday){ bd=ST.Present.s; }
          }
          else if(status==="Absent") {
            bg=dark?ST.Absent.ds:ST.Absent.ls;
            bd=dark?ST.Absent.db:ST.Absent.lb;
            numCol=dark?ST.Absent.dn:ST.Absent.ln;
            icon="a";
            iconCol=ST.Absent.s;
            if(isToday){ bd=ST.Absent.s; }
          }
          else if(status==="Leave")  {
            bg=dark?ST.Leave.ds:ST.Leave.ls;
            bd=dark?ST.Leave.db:ST.Leave.lb;
            numCol=dark?ST.Leave.dn:ST.Leave.ln;
            icon="l";
            iconCol=ST.Leave.s;
            if(isToday){ bd=ST.Leave.s; }
          }
          // Only apply these if NO status
          else if(isToday)         { bg=dark?`${P}2e`:`${P}12`; bd=P; numCol=dark?"#88c4ee":P; }
          else if(isBef)           { bg=tk.dimBg; bd=tk.dimBd; numCol=tk.dimNum; }
          else if(isWknd)          { bg=tk.wkBg;  bd=tk.wkBd; numCol=tk.wkNum; }
          else if(isFut)           { bg=tk.fuBg;  bd=tk.fuBd; numCol=tk.fuNum; }
          else                     { bg=tk.dBg; bd=tk.dBd; numCol=tk.dNum; }

          return (
            <div key={ds} className="cal-cell"
              onClick={()=>{ if(isBef){onBeforeJoin&&onBeforeJoin();return;} onDateClick(ds); }}
              style={{borderRadius:10,background:bg,border:`2px solid ${isToday&&!status?P:bd}`,
                boxShadow:isToday&&!status?`0 0 0 3px ${P}35`:"none",
                minHeight:62,padding:"7px 3px 5px",cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",gap:3,
                transition:"transform .12s,box-shadow .12s",position:"relative",
                opacity:isBef?.28:1}}>
              {isToday&&!status&&<span style={{position:"absolute",top:4,right:5,width:5,height:5,borderRadius:"50%",background:P}}/>}
              <span style={{fontSize:13,fontWeight:isToday?800:700,lineHeight:1,
                color:numCol,fontFamily:ff}}>{day}</span>
              {icon==="p"&&<FiCheckCircle size={13} style={{color:iconCol,strokeWidth:2.5,flexShrink:0}}/>}
              {icon==="a"&&<FiXCircle     size={13} style={{color:iconCol,strokeWidth:2.5,flexShrink:0}}/>}
              {icon==="l"&&<FiMinusCircle size={13} style={{color:iconCol,strokeWidth:2.5,flexShrink:0}}/>}
              {isWknd&&!isToday&&!isBef&&!status&&(
                <span style={{fontSize:8,fontWeight:700,letterSpacing:".05em",textTransform:"uppercase",color:tk.subWk,lineHeight:1}}>
                  {dow===0?"Sun":"Sat"}
                </span>
              )}
              {isFut&&!isWknd&&!isToday&&!status&&(
                <span style={{fontSize:8,fontWeight:600,color:tk.subFu,lineHeight:1}}>future</span>
              )}
              {!icon&&!isWknd&&!isToday&&!isFut&&!isBef&&(
                <span style={{width:3,height:3,borderRadius:"50%",background:tk.dot,display:"block"}}/>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminAttendance() {
  const navigate=useNavigate();
  const {employeeSlug}=useParams();
  const [employees,setEmployees]=useState([]);
  const [allR,setAllR]=useState([]);
  const [loading,setLoading]=useState(true);
  const [syncing,setSyncing]=useState(false);
  const [err,setErr]=useState("");
  const [search,setSearch]=useState("");
  const [selYear,setSelYear]=useState(new Date().getFullYear());
  const [selMonth,setSelMonth]=useState(new Date().getMonth());
  const [detailM,setDetailM]=useState(null);
  const [markM,setMarkM]=useState(null);
  const [marking,setMarking]=useState(false);

  const [dark,setDark]=useState(()=>typeof window!=="undefined"&&document.documentElement.classList.contains("dark"));
  useEffect(()=>{
    const obs=new MutationObserver(()=>setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement,{attributes:true,attributeFilter:["class"]});
    return()=>obs.disconnect();
  },[]);

  const selEmp=useMemo(()=>employees.find(e=>slug(e.name)===employeeSlug)||null,[employeeSlug,employees]);

  const load=useCallback(async(silent=false)=>{
    try{
      silent?setSyncing(true):setLoading(true); setErr("");
      const [eR,aR]=await Promise.all([userAPI.getUsers(),attendanceAPI.getAllRecords()]);
      const allUsers=Array.isArray(eR.data)?eR.data:eR.data?.users??eR.data?.data??[];
      setEmployees(allUsers.filter(u=>u.role!=="Admin"));
      setAllR(Array.isArray(aR.data)?aR.data:aR.data?.records??aR.data?.data??[]);
    }catch{setErr("Failed to load."); if(!silent)tError("Failed to load attendance data");}
    finally{setLoading(false);setSyncing(false);}
  },[]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{const id=setInterval(()=>load(true),employeeSlug?15000:30000);return()=>clearInterval(id);},[employeeSlug,load]);

  const empList=useMemo(()=>employees.map(emp=>{
    const r=allR.filter(x=>x.userId?._id===emp._id);
    const s=buildAbsent(allR,emp,selYear,selMonth);
    return{...emp,pd:r.filter(x=>x.status==="Present").length,ad:r.filter(x=>x.status==="Absent").length+s.length,ld:r.filter(x=>x.status==="Leave").length,th:r.reduce((a,x)=>a+(x.totalHours||0),0).toFixed(1)};
  }),[employees,allR,selYear,selMonth]);

  const shown=empList.filter(e=>[e.name,e.email,e.department].some(f=>f?.toLowerCase().includes(search.toLowerCase())));

  const cStats=useMemo(()=>{
    if(!selEmp) return{h:"0h",p:0,al:0};
    const r=allR.filter(x=>{const d=new Date(x.date);return x.userId?._id===selEmp._id&&d.getFullYear()===selYear&&d.getMonth()===selMonth;});
    const s=buildAbsent(allR,selEmp,selYear,selMonth);
    return{h:r.reduce((a,x)=>a+(x.totalHours||0),0).toFixed(1)+"h",p:r.filter(x=>x.status==="Present").length,al:r.filter(x=>x.status==="Absent"||x.status==="Leave").length+s.length};
  },[allR,selEmp,selYear,selMonth]);

  const sMap=useMemo(()=>{
    if(!selEmp) return{};
    const r=allR.filter(x=>{const d=new Date(x.date);return x.userId?._id===selEmp._id&&d.getFullYear()===selYear&&d.getMonth()===selMonth;});
    const s=buildAbsent(allR,selEmp,selYear,selMonth);
    const m={};
    s.forEach(x=>{m[x.date]=x.status;});r.forEach(x=>{m[toDS(x.date)]=x.status;});
    return m;
  },[allR,selEmp,selYear,selMonth]);

  const onDate=ds=>{
    const jd=getJoin(selEmp);
    const [y,m,d]=ds.split("-").map(Number);
    const dObj=new Date(y,m-1,d), tDS=getTDS();
    const dow=dObj.getDay(), isWknd=dow===0||dow===6, isFut=ds>tDS;
    if(jd&&dObj<jd){
      tInfo(`${selEmp.name} joined on ${jd.toLocaleDateString([],{day:"numeric",month:"long",year:"numeric"})}. Records before this date are not tracked.`);
      return;
    }
    const rec=allR.find(x=>x.userId?._id===selEmp._id&&toDS(x.date)===ds);
    if(rec){setDetailM({rec,ds,isWknd,isFut});return;}
    const syn=buildAbsent(allR,selEmp,selYear,selMonth).find(x=>x.date===ds);
    if(syn){setDetailM({rec:syn,ds,isWknd,isFut});return;}
    setMarkM({ds,emp:selEmp,isWknd,isFut});
  };

  const doMark=async st=>{
    setMarking(true);
    try{
      await attendanceAPI.adminMarkStatus({userId:markM.emp._id,date:markM.ds,status:st});
      tSuccess(`Marked as ${st} successfully`);
      setMarkM(null);setDetailM(null);await load(true);
    }catch(e){tError(e.response?.data?.message||"Failed to mark attendance");}
    finally{setMarking(false);}
  };

  const T={
    page:    dark?"bg-[#060c18]":"bg-[#eef4fa]",
    card:    dark?"bg-[#091422] border-[#142236]":"bg-white border-[#c4d8ec]",
    txt:     dark?"#f0f8ff":"#0a1e30",
    txt2:    dark?"#6a8aaa":"#4a6a84",
    sep:     dark?"#142236":"#c4d8ec",
    btn:     dark?"bg-[#091422] border-[#142236] text-[#5a8aaa]":"bg-white border-[#c4d8ec] text-[#3a5a7a]",
    inp:     dark?"bg-[#091422] border-[#142236] text-white placeholder-[#2a4060]":"bg-white border-[#c4d8ec] text-[#0a1e30] placeholder-[#7a9ab8]",
    row:     dark?"hover:bg-[#0c1c2e]":"hover:bg-[#eef5fc]",
    selBg:   dark?"#091422":"#ffffff",
    selBd:   dark?"#1c3450":"#c4d8ec",
    selTx:   dark?"#8ab8d4":P,
    mBg:     dark?"#060f1a":"#ffffff",
    mBd:     dark?"#122030":"#d4e8f4",
    mTxt:    dark?"#e4f2ff":"#081828",
    mSub:    dark?"#4a7090":"#5a7a96",
    mDim:    dark?"#2a5070":"#8aaac4",
    mRow:    dark?"rgba(255,255,255,.04)":"#f0f6fb",
    mRBd:    dark?"#1a3050":"#cce0f0",
    mCard:   dark?"rgba(255,255,255,.04)":"#f0f6fb",
    mCardBd: dark?"rgba(255,255,255,.09)":"#cce0f0",
  };

  if(loading) return(
    <div className="flex items-center justify-center h-64" style={{fontFamily:ff}}>
      <div className="flex flex-col items-center gap-3">
        <div className="att-spin"/>
        <p style={{fontSize:12,fontWeight:500,color:T.txt2}}>Loading attendance…</p>
      </div>
    </div>
  );
  if(err) return(
    <div className="flex flex-col items-center justify-center h-64 gap-4" style={{fontFamily:ff}}>
      <FiAlertCircle size={28} color="#dc2626"/>
      <p style={{fontSize:14,color:T.txt2}}>{err}</p>
      <button onClick={()=>load()} style={{background:P,color:"#fff",padding:"9px 22px",borderRadius:10,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>Retry</button>
    </div>
  );

  if(!employeeSlug) return(
    <div className={`min-h-screen ${T.page}`} style={{fontFamily:ff,padding:"16px"}}>
      <Styles dark={dark}/>
      <div style={{maxWidth:1200,margin:"0 auto",display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:T.txt,letterSpacing:"-.02em",margin:0}}>Attendance</h1>
            <p style={{fontSize:12,fontWeight:500,color:T.txt2,marginTop:2}}>{employees.length} team members</p>
          </div>
          <button onClick={()=>load()} className={`att-icon-btn border ${T.btn}`} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",fontSize:12,fontWeight:600,borderRadius:10,cursor:"pointer",background:"transparent"}}>
            <FiRefreshCw className={`${syncing?"att-spin-sm":""}`} size={14}/> Refresh
          </button>
        </div>
        <div style={{position:"relative",maxWidth:320}}>
          <FiSearch style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#7a9ab8",width:14,height:14}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employees…"
            className={`border rounded-xl focus:outline-none ${T.inp}`}
            style={{width:"100%",paddingLeft:38,paddingRight:14,paddingTop:9,paddingBottom:9,fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${T.card}`}>
          <div className="att-table-wrap">
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.sep}`}}>
                  {["Employee","Department","Present","Absent","Leave","Hours",""].map((h,i)=>(
                    <th key={i} style={{padding:"11px 16px",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.txt2,textAlign:i>=2&&i<=5?"center":"left",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.length>0?shown.map(emp=>(
                  <tr key={emp._id} className={`cursor-pointer transition-colors ${T.row}`}
                    style={{borderBottom:`1px solid ${T.sep}`}}
                    onClick={()=>navigate(`/admin/attendance/${slug(emp.name)}`)}>
                    <td style={{padding:"11px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Av name={emp.name}/>
                        <div>
                          <p style={{fontWeight:700,fontSize:13,color:T.txt,margin:0}}>{emp.name}</p>
                          <p style={{fontSize:11,color:T.txt2,marginTop:1}}>{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{padding:"11px 16px"}}>
                      <span style={{fontSize:11,padding:"3px 9px",borderRadius:7,fontWeight:600,background:dark?`${P}18`:`${P}0e`,color:dark?"#7aaac8":P}}>{emp.department||"—"}</span>
                    </td>
                    <td style={{padding:"11px 16px",textAlign:"center"}}><SChip s="Present" v={emp.pd} dark={dark}/></td>
                    <td style={{padding:"11px 16px",textAlign:"center"}}><SChip s="Absent"  v={emp.ad} dark={dark}/></td>
                    <td style={{padding:"11px 16px",textAlign:"center"}}><SChip s="Leave"   v={emp.ld} dark={dark}/></td>
                    <td style={{padding:"11px 16px",textAlign:"center"}}><span style={{fontSize:14,fontWeight:800,color:T.txt}}>{emp.th}h</span></td>
                    <td style={{padding:"11px 16px",textAlign:"right"}}>
                      <button className="att-vbtn" onClick={e=>{e.stopPropagation();navigate(`/admin/attendance/${slug(emp.name)}`);}}
                        style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:9,border:"none",cursor:"pointer",background:P,color:"#fff",fontSize:11,fontWeight:700}}>
                        <FiCalendar size={11}/> View
                      </button>
                    </td>
                  </tr>
                )):(
                  <tr><td colSpan={7} style={{padding:"50px 20px",textAlign:"center",fontSize:13,color:T.txt2}}>{search?"No employees match":"No employees found"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="att-mobile-only">
            {shown.map(emp=>(
              <div key={emp._id} className={`cursor-pointer transition-colors ${T.row}`}
                style={{padding:"14px 16px",borderBottom:`1px solid ${T.sep}`}}
                onClick={()=>navigate(`/admin/attendance/${slug(emp.name)}`)}>
                <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}>
                  <Av name={emp.name} size="md"/>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:700,fontSize:14,color:T.txt,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.name}</p>
                    <p style={{fontSize:12,color:T.txt2,marginTop:1}}>{emp.department||"—"}</p>
                  </div>
                  <FiChevronRight style={{color:T.txt2,flexShrink:0}} size={16}/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center"}}>
                  <SChip s="Present" v={`${emp.pd} Present`} dark={dark}/>
                  <SChip s="Absent"  v={`${emp.ad} Absent`}  dark={dark}/>
                  <SChip s="Leave"   v={`${emp.ld} Leave`}   dark={dark}/>
                  <span style={{fontSize:12,fontWeight:700,color:T.txt2,marginLeft:"auto"}}>{emp.th}h</span>
                </div>
              </div>
            ))}
            {shown.length===0&&(
              <div style={{padding:"50px 20px",textAlign:"center",fontSize:13,color:T.txt2}}>{search?"No employees match":"No employees found"}</div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={4500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme={dark?"dark":"light"}/>
    </div>
  );

  if(!selEmp) return(
    <div className="flex flex-col items-center justify-center h-64 gap-3" style={{fontFamily:ff}}>
      <p style={{fontSize:14,color:"#6a8aaa"}}>Employee not found.</p>
      <button onClick={()=>navigate("/admin/attendance")} style={{color:P,background:"none",border:"none",cursor:"pointer",fontSize:12}}>← Back to list</button>
    </div>
  );

  const jd=getJoin(selEmp);
  const jLabel=jd?.toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"});

  return(
    <div className={`min-h-screen ${T.page}`} style={{fontFamily:ff,padding:"14px"}}>
      <Styles dark={dark}/>
      <div style={{maxWidth:1100,margin:"0 auto",display:"flex",flexDirection:"column",gap:14}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <button onClick={()=>navigate("/admin/attendance")}
            className={`border ${T.btn}`}
            style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",fontSize:12,fontWeight:600,borderRadius:10,cursor:"pointer",background:"transparent"}}>
            <FiArrowLeft size={14}/> <span className="att-hide-xs">Back</span>
          </button>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {syncing&&<span style={{fontSize:11,color:"#22c55e",display:"flex",alignItems:"center",gap:5}}><span className="att-live-dot"/>Live</span>}
            <button onClick={()=>load(true)}
              className={`border ${T.btn}`}
              style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",fontSize:12,fontWeight:600,borderRadius:10,cursor:"pointer",background:"transparent"}}>
              <FiRefreshCw className={`${syncing?"att-spin-sm":""}`} size={13}/>
              <span className="att-hide-xs">{syncing?"Syncing…":"Refresh"}</span>
            </button>
          </div>
        </div>

        <div className={`rounded-2xl border shadow-sm overflow-hidden ${T.card}`}>
          <div style={{height:3,background:`linear-gradient(90deg,${P},${P2},#38bdf8)`}}/>
          <div style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
            <Av name={selEmp.name} size="xl"/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:18,fontWeight:800,color:T.txt,letterSpacing:"-.02em",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selEmp.name}</p>
              {selEmp.position&&<p style={{fontSize:12,color:T.txt2,margin:"2px 0 0"}}>{selEmp.position}</p>}
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:10}}>
                {selEmp.department&&<IPill icon={<FiBriefcase size={11}/>} label="Department" value={selEmp.department} dark={dark} T={T}/>}
                {selEmp.email&&<IPill icon={<FiMail size={11}/>} label="Email" value={selEmp.email} dark={dark} T={T}/>}
                {jLabel&&<IPill icon={<FiCalendar size={11}/>} label="Joined" value={jLabel} dark={dark} T={T}/>}
              </div>
            </div>
          </div>
        </div>

        <div className="att-stats-grid">
          {[
            {label:"Total Hours",    val:cStats.h,  Icon:FiClock,         iBg:dark?"rgba(12,43,78,.65)":"#ddeaf6",   iCol:dark?"#7ab8e8":P,         vCol:dark?"#a0d0f0":P},
            {label:"Present Days",   val:cStats.p,  Icon:BsCalendarCheck, iBg:dark?"rgba(22,163,74,.22)":"#dcf4e8",  iCol:dark?"#4ade80":"#16a34a",  vCol:dark?"#4ade80":"#15803d"},
            {label:"Absent / Leave", val:cStats.al, Icon:FiUserX,         iBg:dark?"rgba(220,38,38,.22)":"#fde4e4",  iCol:dark?"#f87171":"#dc2626",  vCol:dark?"#f87171":"#b91c1c"},
          ].map(({label,val,Icon,iBg,iCol,vCol})=>(
            <div key={label} className={`rounded-2xl border shadow-sm ${T.card}`}
              style={{padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div>
                <p style={{fontSize:11,fontWeight:600,color:T.txt2,margin:"0 0 8px"}}>{label}</p>
                <p style={{fontSize:26,fontWeight:900,color:vCol,margin:0,fontFamily:"'DM Mono','DM Sans',monospace",letterSpacing:"-.02em",lineHeight:1}}>{val}</p>
              </div>
              <div style={{width:44,height:44,borderRadius:13,background:iBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <Icon size={20} color={iCol}/>
              </div>
            </div>
          ))}
        </div>

        <div className={`rounded-2xl border shadow-sm overflow-hidden ${T.card}`}>
          <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,borderBottom:`1px solid ${T.sep}`}}>
            <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
              <h3 style={{fontSize:14,fontWeight:700,color:T.txt,margin:0}}>Attendance Calendar</h3>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {[{Icon:FiCheckCircle,col:ST.Present.s,lbl:"Present"},{Icon:FiXCircle,col:ST.Absent.s,lbl:"Absent"},{Icon:FiMinusCircle,col:ST.Leave.s,lbl:"Leave"}].map(({Icon,col,lbl})=>(
                  <div key={lbl} style={{display:"flex",alignItems:"center",gap:4}}>
                    <Icon style={{color:col,width:11,height:11,strokeWidth:2.5}}/>
                    <span style={{fontSize:11,fontWeight:600,color:T.txt2}}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:7}}>
              {[
                {val:selMonth,opts:MONTHS.map((m,i)=>({v:i,l:m})),cb:v=>setSelMonth(+v)},
                {val:selYear, opts:YEARS.map(y=>({v:y,l:y})),      cb:v=>setSelYear(+v)},
              ].map(({val,opts,cb},pi)=>(
                <div key={pi} style={{position:"relative"}}>
                  <select value={val} onChange={e=>cb(e.target.value)}
                    style={{appearance:"none",background:T.selBg,border:`1.5px solid ${T.selBd}`,color:T.selTx,padding:"6px 26px 6px 10px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",outline:"none"}}>
                    {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <FiChevronDown style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",width:11,height:11,pointerEvents:"none",color:T.txt2}}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:"10px 8px 4px"}}>
            <CalGrid
              year={selYear} month={selMonth} statusMap={sMap}
              onDateClick={onDate}
              onBeforeJoin={()=>{
                const jd2=getJoin(selEmp);
                tInfo(jd2
                  ?`${selEmp.name} joined on ${jd2.toLocaleDateString([],{day:"numeric",month:"long",year:"numeric"})}. Records before this date are not tracked.`
                  :"No records available before this date.");
              }}
              joinDate={jd} dark={dark}/>
          </div>
          <p style={{textAlign:"center",paddingBottom:8,fontSize:11,color:T.txt2,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <FiEdit3 size={10}/> Click any date to view or mark attendance
          </p>
        </div>

        {detailM&&(()=>{
          const r=detailM.rec, ip=r.status==="Present", il=r.status==="Leave";
          const stp=ip?ST.Present:il?ST.Leave:ST.Absent;
          const lbl=ip?"Present":il?"On Leave":"Absent";
          const ico=ip?<FiCheckCircle size={13}/>:il?<FiMinusCircle size={13}/>:<FiXCircle size={13}/>;
          const isWk=detailM.isWknd;
          const tableCols=[
            {h:"Date",          v:fmtShort(detailM.ds)},
            {h:"Check In",      v:fmtT(r.clockIn)},
            {h:"Status",        v:null,isStatus:true},
            {h:"Check Out",     v:fmtT(r.clockOut)},
            {h:"Break",         v:r.breakMinutes?`${r.breakMinutes}m`:"—"},
            {h:"Late",          v:r.lateMinutes?`${r.lateMinutes}m`:"—"},
            {h:"Overtime",      v:r.overtimeMinutes?`${r.overtimeMinutes}m`:"—"},
            {h:"Prod. Hrs",     v:r.totalHours?`${Math.abs(Number(r.totalHours)).toFixed(2)}h`:"—",isHrs:true},
          ];
          const DB = dark;
          const hdrBd  = DB?"rgba(255,255,255,.07)":"rgba(180,215,245,.7)";
          const secBd  = DB?"rgba(255,255,255,.06)":"rgba(180,215,245,.5)";
          const cardBg = DB?"rgba(255,255,255,.04)":"rgba(255,255,255,.8)";
          const cardBd = DB?"rgba(255,255,255,.08)":"rgba(190,220,245,.9)";
          const dimTxt = DB?"#3a6080":"#8ab0c8";
          const valTxt = DB?"#deeeff":"#0c2440";

          return(
            <MModal onClose={()=>setDetailM(null)} dark={dark} T={T} maxWidth={640}>
              <div style={{position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-40,left:-40,width:200,height:200,borderRadius:"50%",
                  background:DB?"rgba(12,43,78,.20)":"rgba(12,43,78,.07)",filter:"blur(40px)",pointerEvents:"none"}}/>
                <div style={{position:"absolute",top:-30,right:20,width:140,height:140,borderRadius:"50%",
                  background:DB?"rgba(26,77,122,.12)":"rgba(26,77,122,.06)",filter:"blur(30px)",pointerEvents:"none"}}/>
                <div style={{height:3,background:`linear-gradient(90deg,${P},${P2},#38bdf8)`,borderRadius:"22px 22px 0 0"}}/>
                <div style={{padding:"16px 18px 14px",borderBottom:`1px solid ${hdrBd}`,position:"relative"}}>
                  <div style={{display:"flex",alignItems:"center",gap:13}}>
                    <div style={{width:48,height:48,borderRadius:14,flexShrink:0,
                      background:`linear-gradient(135deg,${P},${P2})`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      color:"#fff",fontWeight:800,fontSize:16,fontFamily:ff,
                      boxShadow:`0 6px 20px rgba(12,43,78,.50)`}}>
                      {selEmp.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()||"?"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontWeight:800,fontSize:15,color:DB?"#eef6ff":"#081828",margin:0,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:ff,letterSpacing:"-.01em"}}>{selEmp.name}</p>
                      <p style={{fontSize:11,color:DB?"#4a7898":"#7a96b4",margin:"3px 0 0",fontFamily:ff}}>
                        {[selEmp.department,selEmp.position].filter(Boolean).join(" · ")||"Employee"}
                      </p>
                    </div>
                    <button onClick={()=>setDetailM(null)} className="att-close-btn"
                      style={{width:30,height:30,borderRadius:9,flexShrink:0,cursor:"pointer",
                        border:`1px solid ${DB?"rgba(255,255,255,.10)":"rgba(0,0,0,.08)"}`,
                        background:DB?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:DB?"#5a8aaa":"#8aaac0"}}>
                      <FiX size={13}/>
                    </button>
                  </div>
                </div>
              </div>

              <div style={{padding:"16px 18px",borderBottom:`1px solid ${secBd}`}}>
                {(isWk||detailM.isFut)&&<CtxBanner isFut={detailM.isFut} isWknd={isWk} dark={dark}/>}
                {r._syn&&<div style={{marginBottom:10}}>
                  <div style={{display:"flex",gap:8,padding:"8px 12px",borderRadius:10,
                    background:DB?"rgba(255,255,255,.04)":"rgba(0,0,0,.02)",
                    border:`1px solid ${DB?"rgba(255,255,255,.07)":"rgba(0,0,0,.07)"}`,alignItems:"center"}}>
                    <FiAlertCircle size={11} color={dimTxt} style={{flexShrink:0}}/>
                    <p style={{fontSize:11,color:DB?"#5a8aaa":"#7a9ab4",margin:0,fontFamily:ff,fontWeight:500}}>
                      Auto-marked — no clock-in record found for this date.
                    </p>
                  </div>
                </div>}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                  <div>
                    <p style={{fontSize:9,fontWeight:700,letterSpacing:".18em",textTransform:"uppercase",color:dimTxt,margin:"0 0 5px",fontFamily:ff}}>Attendance Record</p>
                    <p style={{fontSize:18,fontWeight:800,color:valTxt,margin:0,fontFamily:ff,letterSpacing:"-.02em"}}>{fmtFull(detailM.ds)}</p>
                  </div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:7,padding:"7px 16px",borderRadius:100,
                    background:ip?(DB?"rgba(22,163,74,.16)":"rgba(22,163,74,.09)"):
                               il?(DB?"rgba(217,119,6,.16)":"rgba(217,119,6,.09)"):
                                  (DB?"rgba(220,38,38,.16)":"rgba(220,38,38,.09)"),
                    border:`1.5px solid ${DB?`${stp.s}40`:`${stp.s}28`}`}}>
                    <span style={{color:DB?stp.dn:stp.s,display:"flex"}}>{ico}</span>
                    <span style={{fontSize:13,fontWeight:700,color:DB?stp.dn:stp.s,fontFamily:ff,letterSpacing:"-.01em"}}>{lbl}</span>
                  </div>
                </div>
              </div>

              <div style={{padding:"16px 18px 0"}}>
                <div className="att-modal-cards">
                  {[
                    {Icon:FiLogIn,  lbl:"Check In",       val:fmtT(r.clockIn),
                      a:"#3b82f6",  aBg:DB?"rgba(59,130,246,.16)":"rgba(59,130,246,.09)"},
                    {Icon:FiLogOut, lbl:"Check Out",      val:fmtT(r.clockOut),
                      a:DB?"#7aa4c0":"#5a7a96", aBg:DB?"rgba(100,140,180,.14)":"rgba(90,120,150,.07)"},
                    {Icon:FiClock,  lbl:"Production Hrs", val:r.totalHours?`${Math.abs(Number(r.totalHours)).toFixed(2)} h`:"—",
                      a:"#10b981",  aBg:DB?"rgba(16,185,129,.16)":"rgba(16,185,129,.09)"},
                    {Icon:ip?FiCheckCircle:il?FiMinusCircle:FiXCircle, lbl:"Status", val:lbl,
                      a:DB?stp.dn:stp.s, aBg:DB?`${stp.s}20`:`${stp.s}0c`},
                  ].map(({Icon,lbl:cl,val,a,aBg})=>(
                    <div key={cl} style={{borderRadius:14,padding:"14px 13px 12px",
                      background:cardBg, border:`1px solid ${cardBd}`,
                      display:"flex",flexDirection:"column",gap:10,
                      backdropFilter:DB?"blur(6px)":"none",
                      WebkitBackdropFilter:DB?"blur(6px)":"none"}}>
                      <div style={{width:34,height:34,borderRadius:10,background:aBg,
                        display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <Icon size={15} color={a}/>
                      </div>
                      <div>
                        <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".09em",color:dimTxt,margin:"0 0 5px",fontFamily:ff}}>{cl}</p>
                        <p style={{fontSize:17,fontWeight:800,color:valTxt,margin:0,
                          fontFamily:"'DM Mono','DM Sans',monospace",lineHeight:1,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{padding:"14px 18px",borderBottom:`1px solid ${secBd}`}}>
                <div style={{borderRadius:12,border:`1px solid ${secBd}`,overflow:"hidden",overflowX:"auto"}}>
                  <div style={{minWidth:510}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",
                      background:DB?"rgba(255,255,255,.04)":"rgba(230,242,252,.8)",
                      borderBottom:`1px solid ${secBd}`}}>
                      {tableCols.map(c=>(
                        <div key={c.h} style={{padding:"9px 5px",fontSize:9,fontWeight:700,
                          textTransform:"uppercase",letterSpacing:".06em",color:dimTxt,textAlign:"center",lineHeight:1.3}}>
                          {c.h}
                        </div>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)"}}>
                      {tableCols.map(c=>(
                        <div key={c.h} style={{padding:"11px 5px",textAlign:"center",
                          display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {c.isStatus?(
                            <span style={{display:"inline-flex",alignItems:"center",gap:3,
                              padding:"3px 8px",borderRadius:20,fontSize:10,fontWeight:600,
                              background:DB?`${stp.s}1e`:`${stp.s}10`,color:DB?stp.dn:stp.s}}>
                              <span style={{width:4,height:4,borderRadius:"50%",background:stp.s,flexShrink:0}}/>{lbl}
                            </span>
                          ):c.isHrs?(
                            <span style={{display:"inline-flex",alignItems:"center",gap:3,
                              padding:"3px 8px",borderRadius:20,fontSize:10,fontWeight:700,
                              background:DB?"rgba(16,185,129,.16)":"rgba(16,185,129,.10)",
                              color:DB?"#34d399":"#059669"}}>
                              <FiClock size={9}/>{c.v}
                            </span>
                          ):(
                            <span style={{fontSize:12,fontWeight:500,color:c.v==="—"?dimTxt:valTxt,fontFamily:ff}}>{c.v}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{padding:"14px 18px 18px",display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={()=>{setDetailM(null);setMarkM({ds:detailM.ds,emp:selEmp,isWknd:detailM.isWknd,isFut:detailM.isFut});}}
                  className="att-primary-btn"
                  style={{flex:1,minWidth:130,padding:"12px 0",borderRadius:11,border:"none",cursor:"pointer",
                    background:`linear-gradient(135deg,${P},${P2})`,color:"#fff",fontWeight:700,fontSize:13,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:7,
                    boxShadow:"0 4px 16px rgba(12,43,78,.40)"}}>
                  <FiEdit3 size={12}/> Override Status
                </button>
                <button onClick={()=>setDetailM(null)} className="att-secondary-btn"
                  style={{flex:1,minWidth:90,padding:"12px 0",borderRadius:11,cursor:"pointer",fontWeight:600,fontSize:13,
                    background:DB?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",
                    border:`1px solid ${DB?"rgba(255,255,255,.10)":"rgba(0,0,0,.08)"}`,
                    color:DB?"#7aaac0":"#5a7a96"}}>
                  Close
                </button>
              </div>
            </MModal>
          );
        })()}

        {markM&&(()=>{
          const DB=dark;
          const hdrBd=DB?"rgba(255,255,255,.07)":"rgba(180,215,245,.7)";
          const secBd=DB?"rgba(255,255,255,.06)":"rgba(180,215,245,.5)";
          return(
          <MModal onClose={()=>!marking&&setMarkM(null)} dark={dark} T={T} maxWidth={420}>
            <div style={{position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-10,width:120,height:120,borderRadius:"50%",
                background:DB?"rgba(12,43,78,.14)":"rgba(12,43,78,.06)",filter:"blur(30px)",pointerEvents:"none"}}/>
              <div style={{height:3,background:`linear-gradient(90deg,${P},${P2},#38bdf8)`,borderRadius:"22px 22px 0 0"}}/>
              <div style={{padding:"16px 18px 14px",borderBottom:`1px solid ${hdrBd}`,position:"relative",
                display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12,flex:1,minWidth:0}}>
                  <div style={{width:44,height:44,borderRadius:13,flexShrink:0,
                    background:`linear-gradient(135deg,${P},${P2})`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#fff",fontWeight:800,fontSize:14,fontFamily:ff,
                    boxShadow:"0 5px 16px rgba(12,43,78,.40)"}}>
                    {(markM.emp?.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:800,fontSize:14,color:DB?"#eef6ff":"#081828",margin:0,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:ff}}>{markM.emp?.name}</p>
                    <p style={{fontSize:11,color:DB?"#4a7898":"#7a96b4",margin:"3px 0 0",fontFamily:ff}}>{markM.emp?.department||"Employee"}</p>
                  </div>
                </div>
                <button onClick={()=>!marking&&setMarkM(null)} className="att-close-btn"
                  style={{width:30,height:30,borderRadius:9,flexShrink:0,cursor:"pointer",
                    border:`1px solid ${DB?"rgba(255,255,255,.10)":"rgba(0,0,0,.08)"}`,
                    background:DB?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:DB?"#5a8aaa":"#8aaac0"}}>
                  <FiX size={13}/>
                </button>
              </div>
            </div>
            <div style={{padding:"14px 18px 0"}}>
              {(markM.isWknd||markM.isFut)&&<CtxBanner isFut={markM.isFut} isWknd={markM.isWknd} dark={dark}/>}
              <p style={{fontSize:9,fontWeight:700,letterSpacing:".16em",textTransform:"uppercase",color:DB?"#3a6080":"#8aaac4",margin:"0 0 4px"}}>Mark Attendance</p>
              <p style={{fontSize:15,fontWeight:700,color:DB?"#deeeff":"#0c2440",margin:0,fontFamily:ff}}>{fmtShort(markM.ds)}</p>
            </div>
            <div style={{padding:"16px 18px 14px"}}>
              <p style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".14em",color:DB?"#3a6080":"#8aaac4",margin:"0 0 12px"}}>Select Status</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  {s:"Present",stp:ST.Present,Icon:FiCheckCircle,lbl:"Present",sub:"Clocked in"},
                  {s:"Absent", stp:ST.Absent, Icon:FiXCircle,    lbl:"Absent", sub:"Not present"},
                  {s:"Leave",  stp:ST.Leave,  Icon:FiMinusCircle,lbl:"Leave",  sub:"Day off"},
                ].map(({s,stp,Icon,lbl,sub})=>(
                  <button key={s} disabled={marking} onClick={()=>doMark(s)} className="att-mk"
                    style={{padding:"16px 8px 14px",borderRadius:14,cursor:"pointer",
                      background:DB?"rgba(255,255,255,.04)":"rgba(255,255,255,.9)",
                      border:`1.5px solid ${DB?`${stp.s}38`:`${stp.s}28`}`,
                      display:"flex",flexDirection:"column",alignItems:"center",gap:10,
                      textAlign:"center",opacity:marking?.4:1,transition:"all .14s ease"}}>
                    <div style={{width:46,height:46,borderRadius:13,background:stp.s,
                      display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
                      boxShadow:`0 4px 14px ${stp.s}55`}}>
                      <Icon size={21}/>
                    </div>
                    <div>
                      <p style={{fontSize:13,fontWeight:700,color:DB?stp.dn:stp.s,margin:0,fontFamily:ff}}>{marking?"…":lbl}</p>
                      <p style={{fontSize:10,fontWeight:400,color:DB?"#4a7090":"#7a9ab0",margin:"3px 0 0",fontFamily:ff}}>{sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{padding:"0 18px 18px"}}>
              <button disabled={marking} onClick={()=>setMarkM(null)} className="att-secondary-btn"
                style={{width:"100%",padding:"11px 0",borderRadius:11,cursor:"pointer",fontWeight:600,fontSize:13,
                  background:DB?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)",
                  border:`1px solid ${DB?"rgba(255,255,255,.10)":"rgba(0,0,0,.08)"}`,
                  color:DB?"#7aaac0":"#5a7a96"}}>
                Cancel
              </button>
            </div>
          </MModal>
          );
        })()}

      </div>
      <ToastContainer position="top-right" autoClose={4500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover theme={dark?"dark":"light"}/>
    </div>
  );
}

function CtxBanner({isFut,isWknd,dark}){
  const col=isFut?"#818cf8":"#f59e0b";
  const bg=isFut?(dark?"rgba(129,140,248,.10)":"rgba(99,102,241,.07)"):(dark?"rgba(245,158,11,.10)":"rgba(245,158,11,.07)");
  const bd=isFut?(dark?"rgba(129,140,248,.28)":"rgba(99,102,241,.20)"):(dark?"rgba(245,158,11,.28)":"rgba(245,158,11,.20)");
  const txt=isFut?(dark?"#a5b4fc":"#4338ca"):(dark?"#fbbf24":"#92400e");
  const msg=isFut?"Future date — admin is allowed to pre-mark attendance.":isWknd?"Weekend day — admin override is allowed.":"";
  if(!msg) return null;
  return(
    <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",borderRadius:10,background:bg,border:`1px solid ${bd}`,marginBottom:11}}>
      <FiAlertTriangle size={11} color={col} style={{flexShrink:0}}/>
      <span style={{fontSize:11,fontWeight:600,color:txt,fontFamily:ff,lineHeight:1.4}}>{msg}</span>
    </div>
  );
}
function IPill({icon,label,value,dark,T}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:8,background:dark?`${P}16`:`${P}09`,border:`1px solid ${dark?`${P}32`:`${P}1c`}`,maxWidth:220}}>
      <span style={{color:dark?"#4a6a88":P,display:"flex",flexShrink:0}}>{icon}</span>
      <div style={{minWidth:0}}>
        <p style={{fontSize:9,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:dark?"#2e4860":"#6a8aaa",margin:0,fontFamily:ff}}>{label}</p>
        <p style={{fontSize:12,fontWeight:600,color:dark?"#a0c8e4":"#0a2840",margin:"1px 0 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:ff}}>{value}</p>
      </div>
    </div>
  );
}
function Av({name="",size="sm"}){
  const ini=name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const dims={sm:"32px",md:"40px",lg:"48px",xl:"56px"}[size]||"32px";
  const fs={sm:"12px",md:"14px",lg:"16px",xl:"18px"}[size]||"12px";
  return(
    <div style={{width:dims,height:dims,borderRadius:11,flexShrink:0,background:`linear-gradient(135deg,${P},${P2})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:fs,fontFamily:ff}}>
      {ini||<FiUser size={14}/>}
    </div>
  );
}
function SChip({s,v,dark}){
  const p=ST[s];
  return <span style={{display:"inline-flex",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,fontFamily:ff,background:dark?`${p.s}22`:`${p.s}10`,color:dark?p.dn:p.s}}>{v}</span>;
}
function MModal({children,onClose,dark,T,maxWidth=480}){
  return(
    <div style={{
      position:"fixed",top:0,left:0,width:"100vw",height:"100vh",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:9999,padding:"14px",
      background: dark ? "rgba(2,8,18,.52)" : "rgba(8,22,48,.32)",
      backdropFilter:"blur(20px) saturate(180%)",
      WebkitBackdropFilter:"blur(20px) saturate(180%)",
      boxSizing:"border-box",
    }}
      onClick={onClose}>
      <div className="att-mi"
        style={{
          width:"100%", maxWidth,
          maxHeight:"calc(100vh - 28px)",
          overflowY:"auto", overflowX:"hidden",
          borderRadius:22,
          background: dark
            ? "linear-gradient(160deg,#0f2240 0%,#091a2e 55%,#08162a 100%)"
            : "linear-gradient(160deg,#ffffff 0%,#f6faff 100%)",
          border: dark
            ? "1px solid rgba(120,180,255,.12)"
            : "1px solid rgba(160,200,240,.80)",
          boxShadow: dark
            ? "0 0 0 1px rgba(255,255,255,.04), 0 40px 80px rgba(0,0,0,.75), 0 12px 40px rgba(0,0,0,.55)"
            : "0 28px 70px rgba(8,28,60,.18), 0 4px 16px rgba(8,28,60,.08)",
        }}
        onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
function Styles({dark}){
  return(
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
      .att-spin{width:24px;height:24px;border-radius:50%;border:2.5px solid rgba(12,43,78,.15);border-top-color:#0C2B4E;animation:att-sk .7s linear infinite}
      .att-spin-sm{animation:att-sk .7s linear infinite}
      @keyframes att-sk{to{transform:rotate(360deg)}}
      .att-mi{animation:att-mi-kf .22s cubic-bezier(.22,.8,.22,1)}
      @keyframes att-mi-kf{from{opacity:0;transform:translateY(14px) scale(.978)}to{opacity:1;transform:none}}
      .att-mi::-webkit-scrollbar{display:none}
      .att-mi{scrollbar-width:none;-ms-overflow-style:none}
      .att-live-dot{display:inline-block;width:6px;height:6px;borderRadius:50%;background:#22c55e;animation:att-pulse 1.8s ease-in-out infinite}
      @keyframes att-pulse{0%,100%{opacity:1}50%{opacity:.3}}
      .cal-cell:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,${dark?.22:.10}) !important}
      .att-close-btn:hover{background:rgba(255,255,255,.14) !important}
      .att-vbtn:hover{opacity:.88}
      .att-mk:hover:not(:disabled){transform:translateY(-2px) !important;filter:brightness(1.06)}
      .att-primary-btn:hover{opacity:.9}
      .att-secondary-btn:hover{opacity:.8}
      .att-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
      @media(max-width:600px){.att-stats-grid{grid-template-columns:1fr;gap:8px}}
      .att-modal-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
      @media(max-width:560px){.att-modal-cards{grid-template-columns:repeat(2,1fr);gap:8px}}
      @media(max-width:340px){.att-modal-cards{grid-template-columns:1fr;gap:7px}}
      .att-table-wrap{display:block;overflow-x:auto}
      .att-mobile-only{display:none}
      @media(max-width:700px){
        .att-table-wrap{display:none}
        .att-mobile-only{display:block}
      }
      @media(max-width:500px){.cal-cell{min-height:50px !important;padding:5px 2px 4px !important}}
      @media(max-width:380px){.cal-cell{min-height:42px !important;gap:2px !important}}
      @media(max-width:380px){.cal-cell span:first-of-type{font-size:11px !important}}
      .att-hide-xs{display:inline}
      @media(max-width:360px){.att-hide-xs{display:none}}
    `}</style>
  );
}