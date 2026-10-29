import { useEffect, useState } from "react";
import { api, jsonBody } from "../lib/api";
import FormattedAnswer from "../components/FormattedAnswer";

const DEFAULT_QUESTION = "ช่วยแนะนำสิ่งที่ควรทบทวนและกิจกรรมการสอนครั้งถัดไป";

export default function Advice() {
  const [learners, setLearners] = useState([]);
  const [learnerId, setLearnerId] = useState("");
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [adviceType, setAdviceType] = useState("teaching_plan");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [learnerData, historyData] = await Promise.all([api("/learners"), api("/advice")]);
      setLearners(learnerData); setHistory(historyData);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function ask(e) {
    e.preventDefault(); setBusy(true); setError(""); setAnswer("");
    try {
      const result = await api("/advice", {
        method: "POST",
        body: jsonBody({
          learner_id: learnerId ? Number(learnerId) : null,
          question,
          advice_type: adviceType,
        }),
      });
      setAnswer(result.advice);
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return <>
    <h1>AI ผู้ช่วยครู</h1>
    <p className="lead">ให้ AI ใช้ประวัติที่บันทึกไว้ช่วยวางแผน สรุปความคืบหน้า หรือร่างบันทึกส่งต่อ</p>
    <section className="panel">
      <form onSubmit={ask}>
        <label>ประเภทคำตอบ
          <select value={adviceType} onChange={e => setAdviceType(e.target.value)}>
            <option value="teaching_plan">แผนการสอนครั้งถัดไป</option>
            <option value="handover_draft">ร่างบันทึกส่งต่อครู</option>
            <option value="progress_summary">สรุปความคืบหน้า</option>
          </select>
        </label>
        <label>เลือกนักเรียน
          <select value={learnerId} onChange={e => setLearnerId(e.target.value)}>
            <option value="">ไม่ระบุ — ใช้คำถามทั่วไป</option>
            {learners.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label>คำถามหรือบริบทเพิ่มเติม
          <textarea rows="4" maxLength="4000" value={question} onChange={e => setQuestion(e.target.value)} placeholder="บอกสิ่งที่อยากให้ AI ช่วย..." />
        </label>
        <p className="muted">AI ใช้ข้อมูลการสอนและบันทึกส่งต่อที่มีอยู่เท่านั้น ควรตรวจทานก่อนนำไปใช้จริง</p>
        <button disabled={busy || !question.trim()}>{busy ? "กำลังวิเคราะห์..." : "สร้างคำแนะนำ"}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    {answer && <article className="item advice">
      <div className="item-meta"><h2>คำตอบจาก AI</h2><button type="button" className="ghost" onClick={() => navigator.clipboard?.writeText(answer)}>คัดลอกคำตอบ</button></div>
      <FormattedAnswer text={answer} />
    </article>}
    <h2>ประวัติคำแนะนำ</h2>
    {!history.length && <article className="item empty-state">ยังไม่มีประวัติคำแนะนำ</article>}
    {history.map(item => <details className="item advice-history" key={item.id}>
      <summary><span>{item.prompt_summary || "คำแนะนำจาก AI"}</span><small>{item.created_at ? new Date(item.created_at).toLocaleString("th-TH") : ""}</small></summary>
      <FormattedAnswer text={item.advice} />
    </details>)}
  </>;
}
