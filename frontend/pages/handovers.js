import { useEffect, useState } from "react";
import { api, jsonBody } from "../lib/api";

export default function Handovers() {
  const [learners, setLearners] = useState([]);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);
  const [title, setTitle] = useState("");
  const [stuck, setStuck] = useState("");
  const [tasks, setTasks] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [a, b] = await Promise.all([api("/learners"), api("/handovers")]);
      setLearners(a); setRows(b);
      setSelected(current => current.filter(id => a.some(x => x.id === id)));
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);
  function toggleLearner(id) {
    setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  }
  function selectAll() {
    setSelected(selected.length === learners.length ? [] : learners.map(x => x.id));
  }
  async function add(e) {
    e.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      await api("/handovers/bulk", {
        method: "POST",
        body: jsonBody({
          learner_ids: selected,
          title: title.trim(),
          learner_stuck_on: stuck,
          next_teacher_tasks: tasks,
          assigned_to: assignedTo,
        }),
      });
      setNotice(`สร้างบันทึกส่งต่อสำเร็จ ${selected.length} คน`);
      setSelected([]); setTitle(""); setStuck(""); setTasks(""); setAssignedTo("");
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  async function toggle(row) {
    setError(""); setNotice("");
    try {
      await api(`/handovers/${row.id}`, { method: "PATCH", body: jsonBody({ is_completed: !row.is_completed }) });
      await load();
    } catch (e) { setError(e.message); }
  }

  return <>
    <h1>บันทึกส่งต่องาน</h1>
    <p className="lead">สร้างบันทึกส่งต่อชุดเดียวสำหรับนักเรียนหลายคน แล้วติดตามสถานะได้รายคน</p>
    <div className="cols">
      <section className="panel">
        <h2>สร้างบันทึกส่งต่อ</h2>
        {!learners.length ? <p>ยังไม่มีรายชื่อนักเรียน <a href="/students">เพิ่มนักเรียนก่อน</a></p> : <form onSubmit={add}>
          <div className="selection-toolbar">
            <strong>เลือกนักเรียน ({selected.length}/{learners.length})</strong>
            <button type="button" className="plain" onClick={selectAll}>{selected.length === learners.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}</button>
          </div>
          <div className="learner-picker">
            {learners.map(learner => <label className="check-row" key={learner.id}>
              <input type="checkbox" checked={selected.includes(learner.id)} onChange={() => toggleLearner(learner.id)} />
              <span><strong>{learner.name}</strong><small>{[learner.course, learner.level].filter(Boolean).join(" · ") || "ไม่ระบุคอร์ส"}</small></span>
            </label>)}
          </div>
          <label>หัวข้อ<input required maxLength="240" value={title} onChange={e => setTitle(e.target.value)} placeholder="เช่น ติดตามแบบฝึกหัดบทที่ 3" /></label>
          <label>จุดที่ต้องติดตาม<textarea value={stuck} onChange={e => setStuck(e.target.value)} /></label>
          <label>งานถัดไป<textarea required value={tasks} onChange={e => setTasks(e.target.value)} /></label>
          <label>ผู้รับช่วง<input value={assignedTo} onChange={e => setAssignedTo(e.target.value)} placeholder="ชื่อครูหรือทีม" /></label>
          <p className="muted">ระบบสร้างบันทึกแยกให้นักเรียนแต่ละคน เพื่อให้ติดตามสถานะได้อิสระ</p>
          <button disabled={busy || !selected.length || !title.trim() || !tasks.trim()}>{busy ? "กำลังบันทึก..." : `สร้างบันทึก ${selected.length || ""} คน`}</button>
        </form>}
      </section>
      <section>
        <h2>รายการส่งต่อ</h2>
        {!rows.length && <article className="item empty-state">ยังไม่มีบันทึกส่งต่อ</article>}
        {rows.map(row => <article className="item" key={row.id}>
          <div className="item-meta"><small>{row.created_at ? new Date(row.created_at).toLocaleDateString("th-TH") : ""}</small><span className={`status-pill ${row.is_completed ? "status-done" : ""}`}>{row.is_completed ? "ติดตามแล้ว" : "รอติดตาม"}</span></div>
          <h3>{row.learner_name}: {row.title}</h3>
          {row.learner_stuck_on && <p><strong>จุดที่ติด:</strong> {row.learner_stuck_on}</p>}
          <p><strong>งานถัดไป:</strong> {row.next_teacher_tasks}</p>
          {row.assigned_to && <p><strong>ผู้รับช่วง:</strong> {row.assigned_to}</p>}
          <button className="ghost" onClick={() => toggle(row)}>{row.is_completed ? "ย้อนสถานะ" : "ทำเครื่องหมายติดตามแล้ว"}</button>
        </article>)}
      </section>
    </div>
    {notice && <p className="success" role="status">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </>;
}
