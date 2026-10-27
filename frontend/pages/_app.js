import "../styles/globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { token, logout } from "../lib/api";
export default function App({ Component, pageProps }) {
  const [logged, setLogged] = useState(false);
  const router = useRouter();
  useEffect(() => setLogged(!!token()), [router.asPath]);
  return <><header><Link className="brand" href="/">Class Handover</Link><nav>{logged ? <><Link href="/dashboard">Dashboard</Link><Link href="/students">Students</Link><Link href="/sessions">Sessions</Link><Link href="/handovers">Handovers</Link><Link href="/advice">AI Advice</Link><button className="plain" onClick={logout}>Logout</button></> : <><Link href="/login">Login</Link><Link href="/register">Register</Link></>}</nav></header><main><Component {...pageProps}/></main><footer>Class Handover MVP</footer></>;
}
