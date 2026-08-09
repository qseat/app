import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    n: '01',
    title: 'Discover',
    body: 'The evening starts with a place. Browse by area — the Pearl, Lusail, Msheireb — then by the room you want to sit in.',
  },
  {
    n: '02',
    title: 'Reserve',
    body: 'Pick a time, a party size and a table you actually want. The house replies, or offers you a nearby hour.',
  },
  {
    n: '03',
    title: 'Arrive',
    body: 'Show your code at the door. No calling ahead, no explaining who you are, no waiting to be found on a list.',
  },
]

export function Intro() {
  const [i, setI] = useState(0)
  const nav = useNavigate()
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  return (
    <div className="mx-auto flex h-full max-w-[520px] flex-col justify-between bg-bg px-7 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(72px,env(safe-area-inset-top))]">
      <p className="text-center font-display text-[15px] uppercase tracking-[0.5em] text-goldt">
        QSeat
      </p>

      <div className="fade-up" key={step.n}>
        <p className="font-display text-[64px] leading-none text-goldt">{step.n}</p>
        <h1 className="mt-5 font-display text-4xl leading-tight text-fg">{step.title}</h1>
        <p className="mt-5 max-w-[32ch] text-[14px] leading-relaxed text-muted">{step.body}</p>
      </div>

      <div>
        <div className="mb-7 flex gap-2">
          {STEPS.map((_, k) => (
            <span
              key={k}
              className="h-[2px] flex-1 bg-gold transition-opacity"
              style={{ opacity: k <= i ? 1 : 0.2 }}
            />
          ))}
        </div>
        <button
          className="btn w-full"
          onClick={() => (last ? nav('/signin', { replace: true }) : setI(i + 1))}
        >
          {last ? 'Begin' : 'Next'}
        </button>
        {!last && (
          <button
            className="smallcaps mt-5 w-full text-muted"
            onClick={() => nav('/signin', { replace: true })}
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
