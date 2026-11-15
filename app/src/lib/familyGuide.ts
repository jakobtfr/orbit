import type { FamilyMember } from './family'

/**
 * The guided conversation of the "talk freely" preview. It is staged, and the app says so: for each person
 * a handful of things to say, each with a reply the team wrote in that person's character, building on what
 * they recorded that day, and rendered ahead of time in that person's AI voice. After each reply the
 * suggestions change, so it reads as a conversation. Saying or typing the same thing gives the same reply.
 *
 * In the product these replies would come from a model on board, one per family member, built from that
 * person's own consented conversations. See docs/DEMO.md.
 */

/** Shown on screen for as long as talk freely is on. */
export const GUIDE_NOTICE = 'Staged demo. Replies to the suggestions are written by the team and spoken by an AI voice. Not the real person, not live.'

export interface GuideNode {
  id: string
  /** The suggestion as shown on its chip. */
  say: string
  match: RegExp
  reply: string
  /** The suggestions offered after this reply, by id. */
  next: string[]
}

const MISS = /\bmiss (you|home|everyone|you all|them)\b|\bthinking (of|about) you\b|\bwish (you were|i was|i were)\b/
const NIGHT = /\bgood ?night\b|\bsay good ?night\b|\bsleep well\b|\bbye\b|\bgoodbye\b|\bhave to go\b/
const HOME = /\bhow('?s| is| are) (every(one|body)|things|they all|you all|the family)\b|\bhow('?s| is) it going (at|back) home\b/

export const GUIDE: Record<string, GuideNode[]> = {
  marta: [
    {
      id: 'home', say: 'How is everyone at home?', match: HOME,
      reply: 'Everyone is well. Your father ate the apples I had put aside for the cake, so now it is a smaller cake. Jonas brings the children on Sunday, and Bruno sits under your chair as if you were only late for dinner.',
      next: ['miss', 'today', 'dog'],
    },
    {
      id: 'miss', say: 'I miss you', match: MISS,
      reply: 'I miss you too, my girl. I drink from your blue cup every morning, so the kitchen feels a little less empty. And at night I look up and say good night to the sky.',
      next: ['stars', 'today', 'night'],
    },
    {
      id: 'today', say: 'What did you do today?', match: /\bwhat (did|have) you (do|done|been)\b|\bwhat are you (doing|up to)\b|\byour day\b|\bhow was (today|your day|the day)\b/,
      reply: 'I picked the last apples and baked the cake with too much cinnamon, the way you like it. Then I sat down with my coffee and recorded this message for you. That was the best part of my day.',
      next: ['dog', 'stars', 'night'],
    },
    {
      id: 'dog', say: 'Tell me about the dog', match: /\b(dog|bruno|puppy)\b/,
      reply: 'Bruno dug up my tulip bulbs again. I was cross for a moment, and then he looked at me. He still waits by the door around the time you used to come home.',
      next: ['home', 'miss', 'night'],
    },
    {
      id: 'stars', say: 'Do you remember the shooting stars?', match: /\b(shooting )?stars?\b|\bremember\b|\bthat night\b/,
      reply: 'Of course I remember. We lay in the garden under the old blanket and you counted eleven. You said you would go up there one day, and I laughed. I am not laughing now. I am proud.',
      next: ['miss', 'home', 'night'],
    },
    {
      id: 'night', say: 'Say good night', match: NIGHT,
      reply: 'Good night, my dear. Think of the kitchen, the radio, and the smell of apple cake. I will record again tomorrow morning. I love you.',
      next: [],
    },
  ],
  jonas: [
    {
      id: 'home', say: 'How is everyone at home?', match: HOME,
      reply: 'Everyone is fine. The kids drew your ship again, and it hangs on the fridge next to the one with six windows and a dog. Mum feeds all of us on Sunday.',
      next: ['kids', 'bike', 'miss'],
    },
    {
      id: 'kids', say: 'Tell me about the kids', match: /\b(kids|children|nephew|niece|little ones)\b/,
      reply: 'They tell the whole playground that their aunt flies to Mars. The small one asked if you can see her wave. I said yes, so please wave back.',
      next: ['bike', 'miss', 'night'],
    },
    {
      id: 'bike', say: 'How is my bike?', match: /\bbike\b|\bbicycle\b|\bgarage\b/,
      reply: 'Fixed, oiled, and waiting in the garage. I took it for a test ride. Fine, a few test rides. When you are back, we ride to the lake.',
      next: ['kids', 'miss', 'night'],
    },
    {
      id: 'miss', say: 'I miss you', match: MISS,
      reply: 'I miss you too, big sister. Nobody argues with me about the music in the car any more. It is far too peaceful.',
      next: ['home', 'bike', 'night'],
    },
    {
      id: 'night', say: 'Say good night', match: NIGHT,
      reply: 'Good night, Lena. The kids picked a star for you tonight. Talk tomorrow. Well, you know what I mean.',
      next: [],
    },
  ],
  priya: [
    {
      id: 'home', say: 'How is the team?', match: /\b(the |our )?team\b|\bhow is every(one|body)\b|\bhow('?s| is) work\b|\boffice\b|\bsimulator\b/,
      reply: 'Loud and proud. We watched your docking replay again at lunch, and again nobody touched their food. Your chair is empty and nobody may sit in it. My rule.',
      next: ['plant', 'today', 'miss'],
    },
    {
      id: 'plant', say: 'How is my plant?', match: /\bplant\b|\bdesk\b/,
      reply: 'Alive, and I am as surprised as you are. I talk to it about flight rules. It has a new leaf, and I take full credit for that.',
      next: ['today', 'miss', 'night'],
    },
    {
      id: 'today', say: 'What did you do today?', match: /\bwhat (did|have) you (do|done|been)\b|\bwhat are you (doing|up to)\b|\byour day\b|\bhow was (today|your day|the day)\b/,
      reply: 'Simulator runs all morning with the new trainees, on your old checklist. They complained about it. I told them it was your fault.',
      next: ['plant', 'miss', 'night'],
    },
    {
      id: 'miss', say: 'I miss you', match: MISS,
      reply: 'We miss you here too. Lunch is quieter without you stealing my fries. Come back and steal them.',
      next: ['home', 'plant', 'night'],
    },
    {
      id: 'night', say: 'Say good night', match: NIGHT,
      reply: 'Good night, Lena. Fly safe. More tomorrow.',
      next: [],
    },
  ],
}

export interface Guided { id: string; text: string; audio: string; next: string[] }

/** The written reply to what was said, when it is one of this person's suggestions or means the same. */
export function guidedReply(said: string, member: FamilyMember): Guided | undefined {
  const q = said.toLowerCase().replace(/[’‘]/g, "'").replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ').trim()
  const nodes = GUIDE[member.id] ?? []
  // Good night ends the talk, so it wins when it is said together with something else.
  const node = nodes.find((n) => n.id === 'night' && n.match.test(q)) ?? nodes.find((n) => n.match.test(q))
  return node ? { id: node.id, text: node.reply, audio: `family/${member.id}-talk-${node.id}.m4a`, next: node.next } : undefined
}

/** The suggestions as shown on chips, for a list of ids. */
export function chipsFor(member: FamilyMember, ids: string[]): string[] {
  const nodes = GUIDE[member.id] ?? []
  return ids.flatMap((id) => { const n = nodes.find((x) => x.id === id); return n ? [n.say] : [] })
}

/** The suggestions a talk starts with: everything this person can answer. */
export function startChips(member: FamilyMember): string[] {
  return (GUIDE[member.id] ?? []).map((n) => n.say)
}
