import { useEffect, useMemo, useState } from "react";
import { api, jsonBody } from "../lib/api";

export default function Sessions() {
  const [learners, setLearners] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [progress, setProgress] = useState("กำลังพัฒนา");
  const [difficulties, setDifficulties] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedCount = selected.length;
  const learnerNames = useMemo(() => new Map(learners.map(x => [x.id, x.name])), [learners]);

  async function load() {
    try {
      const [learnerData, sessionData] = await Promise.all([api("/learners"), api("/sessions")]);
      setLearners(learnerData);
      setRows(sessionData);
      setSelected(current => current.filter(id => learnerData.some(x => x.id === id)));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  function toggleLearner(id) {
    setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  }
  function selectAll() {
    setSelected(selected.length === learners.length ? [] : learners.map(x => x.id));
  }
  async function save(e) {
    e.preventDefault();
    setError(""); setNotice(""); setBusy(true);
    try {
      await api("/sessions/bulk", {
        method: "POST",
        body: jsonBody({
          learner_ids: selected,
          session_date: date,
          topic: topic.trim(),
          content_covered: content,
          progress,
          difficulties,
          next_steps: nextSteps,
        }),
      });
      setNotice(`บันทึกการสอนสำเร็จ ${selectedCount} คน`);
      setTopic(""); setContent(""); setDifficulties(""); setNextSteps(""); setSelected([]);
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <>
    <h1>บันทึกการสอน</h1>
    <p className="lead">กรอกข้อมูลการสอนครั้งเดียว แล้วบันทึกให้นักเรียนหลายคนพร้อมกัน</p>
    <div className="cols">
      <section className="panel">
        <h2>บันทึกหลายคน</h2>
        {!learners.length ? <p>ยังไม่มีรายชื่อนักเรียน <a href="/students">เพิ่มนักเรียนก่อน</a></p> : <form onSubmit={save}>
          <div className="selection-toolbar">
            <strong>เลือกนักเรียน ({selectedCount}/{learners.length})</strong>
            <button type="button" className="plain" onClick={selectAll}>{selected.length === learners.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}</button>
          </div>
          <div className="learner-picker">
            {learners.map(learner => <label className="check-row" key={learner.id}>
              <input type="checkbox" checked={selected.includes(learner.id)} onChange={() => toggleLearner(learner.id)} />
              <span><strong>{learner.name}</strong><small>{[learner.course, learner.level].filter(Boolean).join(" · ") || "ไม่ระบุคอร์ส"}</small></span>
            </label>)}
          </div>
          <label>วันที่<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
          <label>หัวข้อที่สอน<input required maxLength="240" value={topic} onChange={e => setTopic(e.target.value)} placeholder="เช่น Present Simple" /></label>
          <label>เนื้อหาที่สอน<textarea value={content} onChange={e => setContent(e.target.value)} placeholder="หัวข้อหรือกิจกรรมที่ทำร่วมกัน" /></label>
          <label>ความคืบหน้า<select value={progress} onChange={e => setProgress(e.target.value)}><option>ทำได้ดี</option><option>กำลังพัฒนา</option><option>ต้องทบทวน</option></select></label>
          <label>จุดที่ต้องติดตาม<textarea value={difficulties} onChange={e => setDifficulties(e.target.value)} placeholder="ข้อมูลร่วมกันสำหรับนักเรียนที่เลือก" /></label>
          <label>ขั้นตอนถัดไป<textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} placeholder="สิ่งที่ควรทำต่อ" /></label>
          <p className="muted">ข้อมูลชุดนี้จะถูกบันทึกแยกเป็นประวัติรายคน โดยใช้เนื้อหาเดียวกัน</p>
          <button disabled={busy || !selected.length || !topic.trim()}>{busy ? "กำลังบันทึก..." : `บันทึก ${selectedCount || ""} คน`}</button>
        </form>}
      </section>
      <section>
        <h2>ประวัติการสอนล่าสุด</h2>
        {!rows.length && <article className="item empty-state">ยังไม่มีประวัติการสอน</article>}
        {rows.map(row => <article className="item" key={row.id}>
          <div className="item-meta"><small>{row.session_date}</small><span className="status-pill">{row.progress}</span></div>
          <h3>{row.learner_name || learnerNames.get(row.learner_id)}: {row.topic}</h3>
          {row.content_covered && <p>{row.content_covered}</p>}
          {row.difficulties && <p><strong>จุดที่ต้องติดตาม:</strong> {row.difficulties}</p>}
          {row.next_steps && <p><strong>ขั้นต่อไป:</strong> {row.next_steps}</p>}
        </article>)}
      </section>
    </div>
    {notice && <p className="success" role="status">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </>;
}
