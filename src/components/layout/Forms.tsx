import { FormEvent, useEffect, useState } from 'react'
import { Cat, Ghost, Rocket, Smile, Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AVATARS = { smile: Smile, cat: Cat, ghost: Ghost, rocket: Rocket, star: Star }
type Avatar = keyof typeof AVATARS
interface Entry { id: string; nickname: string; message: string; avatar: string; created_at: string }

const field = 'w-full rounded-xl bg-white px-4 py-2.5 text-sm ring-1 ring-black/10 focus:ring-accent-blue'
const btn = 'rounded-full bg-device-body px-5 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-accent-red transition-colors'
const Off = () => <p className="text-sm text-ink-sub">Supabase가 설정되지 않았어요. <code>.env</code>를 확인하세요.</p>

export function Guestbook() {
  const [list, setList] = useState<Entry[]>([])
  const [nick, setNick] = useState('')
  const [msg, setMsg] = useState('')
  const [avatar, setAvatar] = useState<Avatar>('smile')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => supabase?.from('guestbook').select('*').order('created_at', { ascending: false }).limit(20)
    .then(({ data }) => setList((data as Entry[]) ?? []))
  useEffect(() => { load() }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase!.from('guestbook').insert({ nickname: nick.trim(), message: msg.trim(), avatar })
    setBusy(false)
    if (error) return setErr('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    setNick(''); setMsg(''); load()
  }

  return (
    <div>
      <h3 className="mb-4 text-xl font-extrabold tracking-tight">Guestbook</h3>
      {!supabase ? <Off /> : (
        <form onSubmit={submit} className="mb-6 grid gap-3">
          <div className="flex gap-2" role="radiogroup" aria-label="아바타">
            {(Object.keys(AVATARS) as Avatar[]).map(k => {
              const I = AVATARS[k]
              return <button type="button" key={k} role="radio" aria-checked={avatar === k} aria-label={k} onClick={() => setAvatar(k)}
                className={`grid h-10 w-10 place-items-center rounded-full ${avatar === k ? 'bg-accent-blue text-white' : 'bg-white ring-1 ring-black/10'}`}><I size={18} /></button>
            })}
          </div>
          <input className={field} placeholder="닉네임" maxLength={20} required value={nick} onChange={e => setNick(e.target.value)} />
          <textarea className={field} placeholder="한마디 남기기 (200자)" maxLength={200} rows={3} required value={msg} onChange={e => setMsg(e.target.value)} />
          <div className="flex items-center gap-3"><button className={btn} disabled={busy}>남기기</button>{err && <span className="text-sm text-accent-red">{err}</span>}</div>
        </form>
      )}
      <ul className="grid gap-3">
        {list.map(g => {
          const I = AVATARS[g.avatar as Avatar] ?? Smile
          return (
            <li key={g.id} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <I size={20} className="mt-0.5 shrink-0 text-accent-blue" />
              <div className="min-w-0"><b className="text-sm">{g.nickname}</b>
                <span className="label ml-2">{new Date(g.created_at).toLocaleDateString('ko-KR')}</span>
                {/* React escapes text; no HTML injection */}
                <p className="break-words text-sm">{g.message}</p></div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', message: '' })
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setState('busy')
    const { error } = await supabase!.from('contacts').insert(f)
    setState(error ? 'err' : 'ok')
    if (!error) setF({ name: '', email: '', message: '' })
  }

  return (
    <div>
      <h3 className="mb-4 text-xl font-extrabold tracking-tight">Say hello</h3>
      {!supabase ? <Off /> : (
        <form onSubmit={submit} className="grid gap-3">
          <input className={field} placeholder="이름" required maxLength={60} value={f.name} onChange={set('name')} />
          <input className={field} type="email" placeholder="회신받을 이메일" required maxLength={120} value={f.email} onChange={set('email')} />
          <textarea className={field} placeholder="문의 내용" required rows={4} maxLength={2000} value={f.message} onChange={set('message')} />
          <div className="flex items-center gap-3">
            <button className={btn} disabled={state === 'busy'}>보내기</button>
            {state === 'ok' && <span className="text-sm text-accent-blue">전달됐어요. 고마워요!</span>}
            {state === 'err' && <span className="text-sm text-accent-red">전송에 실패했어요.</span>}
          </div>
        </form>
      )}
    </div>
  )
}
