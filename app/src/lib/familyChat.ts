import type { EarthMessage, FamilyMember } from './family'
import type { Person } from './types'

/**
 * "Talk freely", a preview of the next step of the family call. It is not finished and not a model:
 * the team wrote every line. What the astronaut says is matched to one of the topics below and answered
 * with a preset line in that person's character. Nothing here is about health: symptoms, readings and
 * urgent words are taken by ORBIT's fixed rules before a line from this file is ever chosen (family.ts).
 * It is not an assistant either: a knowledge question gets a warm no, never an answer.
 */

/** Shown on screen for as long as the preview is on. */
export const PREVIEW_NOTICE = 'Preview of the next step. Scripted replies written by the team, in an AI voice. Not the real person and not a live model.'

/** The one answer to "are you real?". */
export const HONEST = 'No. This is a preview with replies written by the team, spoken by an AI voice. It is not the real person and not a live model. The recordings in this call are the real messages.'

export interface ChatTopic {
  id: string
  match: RegExp
  /** Lines anyone on Earth could say. */
  all: string[]
  /** Lines only this person would say; they come first. */
  marta?: string[]
  jonas?: string[]
  priya?: string[]
}

export const TOPICS: ChatTopic[] = [
  {
    id: 'howareyou', match: /\bhow are (you|things)\b|\bhow('?s| is) it going\b|\bhow have you been\b|\byou (ok|okay|alright)\b|\bhow do you do\b/,
    all: ['Good, truly. Busy in a nice way. Mostly I think about what to tell you next.', 'All fine here. Nothing dramatic, which is how I like it.'],
    marta: ['I am well, my dear. The kitchen is warm and the radio is on. I only wish you sat across the table.', 'Oh, the same as always. Your father talks to the tomatoes and I pretend not to hear.'],
    jonas: ['Good! Tired in the fun way. The kids had me building a cardboard rocket all evening.', 'Can not complain. The garage is finally tidy, so obviously I can not find anything.'],
    priya: ['Good. The simulator team is loud, the coffee is bad, so everything is normal.', 'Fine! My desk is a mess and I blame you for not being here to judge it.'],
  },
  {
    id: 'today', match: /\bwhat (did|have) you (do|done|been)\b|\bwhat are you (doing|up to)\b|\byour day\b|\bhow was (today|yesterday|the day)\b|\banything new today\b/,
    all: ['A quiet one. Some errands, a long walk, and then this message to you.', 'Nothing big. The small things filled the whole day, as they do.'],
    marta: ['I baked the apple cake, the one with too much cinnamon. Half of it is already gone.', 'I sorted the old photo boxes. I found you with the paper helmet. It is on the fridge now.'],
    jonas: ['Work, then football with the kids in the yard. I lost. They say hello, loudly.', 'I fixed the fence and broke the hammer. A fair trade, I think.'],
    priya: ['Three sim runs before lunch, then a meeting that could have been a note. You know the kind.', 'I ran your old checklist with the new trainees. They complained. I said it was your fault.'],
  },
  {
    id: 'miss', match: /\b(i )?miss (you|home|everyone|you all|them|it)\b|\bwish (you were|i was|i were)\b|\blonely\b|\bfar away\b|\bthinking (of|about) you\b/,
    all: ['We miss you too. Every day. You are in every second sentence here.', 'I know. It is a long way. But you are not out of our thoughts for one hour.'],
    marta: ['I miss you too, my girl. I still set out your cup some mornings before I remember.', 'Oh, Lena. I look up at night and say good night to the sky. The neighbours think I am odd.'],
    jonas: ['Miss you too, big sister. The kids ask every night which star is yours. I point at a new one each time.', 'Same here. Nobody argues with me about music in the car any more. It is too peaceful.'],
    priya: ['We miss you here. Your chair is empty and nobody is allowed to sit in it. My rule.', 'Me too. Lunch is quieter without you stealing my fries.'],
  },
  {
    id: 'weather', match: /\bweather\b|\b(is it|it is) (raining|sunny|cold|warm|hot|snowing)\b|\brain(ing|y)?\b|\bsnow(ing|y)?\b|\bsunny\b|\bseason\b|\bautumn\b|\bwinter\b|\bsummer\b|\bspring\b/,
    all: ['Grey and windy, a proper autumn day. The leaves are all over the street.', 'Cold in the morning, golden in the afternoon. You would have liked the light today.'],
    marta: ['Rain since breakfast. The garden is happy and my washing is not.', 'A clear, cold morning. Frost on the apple tree, and the sky so blue it looked like a postcard.'],
    jonas: ['Windy! The kids flew the kite until it landed in the neighbour\'s tree. It is still there.', 'Wet. So wet. The dog refuses to go out and I respect that.'],
    priya: ['Fog over the whole campus this morning. Very dramatic. The parking lot looked like a film.', 'Sunny, and of course I spent it inside the simulator hall with no windows.'],
  },
  {
    id: 'dog', match: /\b(the |our |your )?(dog|puppy|bruno)\b|\bpets?\b|\b(the )?cat\b/,
    all: ['Bruno is fine and as silly as ever. He still waits by the door around the time you used to come home.', 'The dog is well. He found a stick bigger than himself and carried it all the way home.'],
    marta: ['Bruno sits under your chair at dinner. I tell him you are far away. He does not believe me.', 'That dog dug up my tulip bulbs again. I was cross for one minute, then he looked at me.'],
    jonas: ['Bruno stayed with us last weekend. He and the kids are now one muddy animal with many legs.', 'The dog learned to open the garden gate. We are all very proud and a little worried.'],
    priya: ['I met Bruno when I dropped off your mail. He remembers me. Or he remembers my sandwich.', 'Your brother sent me a photo of the dog in a paper space helmet. It is my screen background now.'],
  },
  {
    id: 'food', match: /\bcook(ing|ed)?\b|\bdinner\b|\blunch\b|\bbreakfast\b|\beat(ing)?\b|\bfood\b|\bbak(e|ing|ed)\b|\bcake\b|\bcoffee\b|\bhungry\b|\brecipe\b/,
    all: ['Soup tonight, the simple one. And yes, I thought of you when I cut the bread.', 'We had pancakes for dinner. No one could give a good reason, and no one needed one.'],
    marta: ['Potato soup tonight, with the good bread. I will make it again the day you are back.', 'Apple cake. Again. The tree gave us so many that the whole street is eating cake.'],
    jonas: ['I tried to grill in the rain. It went as well as it sounds. We ordered pizza.', 'The kids cooked. It was pasta with something. I ate all of it and asked no questions.'],
    priya: ['Canteen curry. Still orange, still a mystery. I had two plates.', 'I brought cake for the team. It lasted four minutes, a new record.'],
  },
  {
    id: 'father', match: /\b(dad|father|papa)\b|\bhow('?s| is) (he|mum|mom|mother|mama)\b|\b(mum|mom|mother|mama)\b/,
    all: ['Everyone at home is well. They talk about you at every meal.', 'All good with the family. Proud, and a bit noisy about it.'],
    marta: ['Your father is in the garden shed building something. He will not say what. I suspect a bird house.', 'He reads every mission update twice and then explains it to me, wrong. I let him.'],
    jonas: ['Mum and Dad are fine. Dad beat me at chess and has mentioned it nine or ten times since.', 'Mum feeds everyone who walks past the house. Dad claims he runs the garden. Nothing has changed.'],
    priya: ['I saw your parents at the family day. Your mother gave me cake to take home. I love her.', 'Your dad asked me how the docking works. I talked for an hour. He took notes.'],
  },
  {
    id: 'kids', match: /\b(the )?(kids|children|nephew|niece|little ones)\b/,
    all: ['The children are growing so fast. They ask about you all the time.', 'Loud, happy and covered in mud, last I saw them.'],
    marta: ['The little ones were here on Sunday. They drew your ship on the kitchen wall. I am leaving it there.', 'They told the whole playground that their aunt flies to Mars. Nobody believed them, so I had to confirm.'],
    jonas: ['They built you a welcome sign already. It is far too early and I did not have the nerve to say so.', 'Both fine. One wants to be a pilot like you, the other wants to be a dinosaur. Both seem possible.'],
    priya: ['Your brother brought the kids to the open day. They pressed every button in the mock-up. Every single one.', 'The small one asked me if you can see her wave. I said yes. Do not correct me.'],
  },
  {
    id: 'garden', match: /\bgarden\b|\bapple tree\b|\bapples?\b|\bflowers?\b|\btomato(es)?\b|\btree\b|\bplants?\b/,
    all: ['The garden is going quiet for the winter. The last apples are in.', 'Everything is brown and gold out there. It smells like wet leaves.'],
    marta: ['The apple tree did well this year. I put a jar of the jam aside with your name on it.', 'I planted the bulbs for spring. When they come up you will be much closer to home.'],
    jonas: ['I mowed Mum\'s lawn. She watched from the window and pointed at the bits I missed.', 'The kids planted a sunflower for you. It is a stick right now, but a hopeful stick.'],
    priya: ['Your desk plant is thriving under my care. I talk to it about flight rules.', 'I got a second plant so yours has company. They seem to get along.'],
  },
  {
    id: 'work', match: /\bwork\b|\bjob\b|\boffice\b|\bthe team\b|\bsimulator\b|\bcolleagues?\b|\bmission control\b|\bcapcom\b|\bboss\b|\btrainees?\b/,
    all: ['Work is work. Busy, but the good kind. People ask about you a lot.', 'The same as ever. Too many meetings, and I still like it.'],
    marta: ['I help at the library on Tuesdays now. The children there know more about your ship than I do.', 'Retired life keeps me busier than my job ever did. Today it was the choir, then the bakery.'],
    jonas: ['The workshop is full. Everyone wants bikes fixed before winter. I tell them all my sister is an astronaut.', 'Fine. My boss put your mission patch on the office wall. I may have given it to him.'],
    priya: ['The simulator team watches your telemetry like it is a football match. There is cheering.', 'Busy. We are writing the next training run from your notes. Your handwriting is still awful, by the way.'],
  },
  {
    id: 'news', match: /\bnews\b|\bwhat('?s| is) (new|happening|going on)\b|\banything new\b|\bgossip\b|\bneighbou?rs?\b|\btown\b|\bback home\b|\bat home\b/,
    all: ['Small news only. The bakery on the corner has a new owner, and the bread is better.', 'Nothing the papers would print. The street has a new bench. People are very excited.'],
    marta: ['The neighbour got a new fence and the whole street has an opinion. I stay out of it. Mostly.', 'The church clock is fixed, after two years. It is now only five minutes wrong.'],
    jonas: ['The football club won. Once. We celebrated as if it were the cup.', 'They are finally repairing the bridge road. It will take forever, so you will not miss the opening.'],
    priya: ['The control room has new walls. They are now a slightly different grey. Morale is unchanged.', 'The coffee machine on our floor was replaced. There was a small farewell party for the old one.'],
  },
  {
    id: 'music', match: /\bmusic\b|\bsongs?\b|\bsing(ing)?\b|\bradio\b|\bband\b|\bconcert\b|\bchoir\b|\bplaylist\b|\bguitar\b|\bpiano\b/,
    all: ['The radio played your song this morning. I turned it up.', 'There is always music on here. It makes the house feel full.'],
    marta: ['The choir is practising for the winter concert. I sing the low part, badly and with joy.', 'I played your old records while cleaning. I danced a little. Do not tell your brother.'],
    jonas: ['The kids found my old guitar. It has three strings now and they love it.', 'I made you a playlist for the way back. It is mostly songs you say you do not like.'],
    priya: ['Someone plays the same four songs in the sim hall every day. I know all the words against my will.', 'We went to a concert last week. I kept turning to tell you things and you were not there.'],
  },
  {
    id: 'memory', match: /\bremember\b|\bwhen (i|we) (was|were)\b|\bold days\b|\bchildhood\b|\bmemor(y|ies)\b|\bthat time\b/,
    all: ['Of course I remember. I think about those days more than you know.', 'I do. I was looking at the old photos only this week.'],
    marta: ['I remember you on the garage roof with a paper map of the stars. You said you were only checking.', 'You were six and you packed a bag for the Moon. A torch, a sandwich, and the cat. I found the list.'],
    jonas: ['I remember you letting me win the bike race once. Only once. I still count it.', 'Remember the tent in the garden? You told me the owl was a space signal. I believed you for years.'],
    priya: ['I remember our first sim together. You flew it perfectly and I dropped my coffee on the console.', 'Remember the night shift when the fire alarm went off and you kept flying? It is still told to new people.'],
  },
  {
    id: 'joke', match: /\bjoke\b|\bmake me laugh\b|\bsomething funny\b|\bfunny\b|\blaugh\b/,
    all: ['Why did the astronaut break up with the Moon? She needed more space. I am sorry. I am not sorry.', 'I told the dog a joke about the vacuum of space. He left the room. He is afraid of the vacuum.'],
    marta: ['Your father says his knees can forecast the weather. That is the joke. He means it.', 'I asked the baker for something out of this world. He gave me a croissant and looked very pleased.'],
    jonas: ['The kids asked what you eat up there. I said launch and dinner. They did not laugh either.', 'I named the new garden gnome after you. He also looks at the sky all day and never calls.'],
    priya: ['How does mission control throw a party? They planet. I will see myself out.', 'A trainee asked where the any key is on the console. I am still recovering.'],
  },
  {
    id: 'love', match: /\b(i )?love you\b|\blove you (all|too|so much)\b|\bhugs?\b|\bkiss(es)?\b/,
    all: ['I love you too. More than this message can carry.', 'And we love you. All of us. Say it back to the stars for me.'],
    marta: ['I love you too, my darling. To Mars and back, and I mean that exactly.', 'Oh, I love you. I have since before you could hold up your own head.'],
    jonas: ['Love you too. Do not make it weird. Fine, make it weird, I miss you.', 'Love you, big sister. The kids send a hug each, and the dog sends a paw.'],
    priya: ['Love you too, you impossible person. Come back and say it in person.', 'Aw. Love you. I am telling the whole team you said that first.'],
  },
  {
    id: 'proud', match: /\bproud\b|\bam i doing (ok|okay|well|good)\b|\bdoing (a )?good job\b|\bbelieve in me\b/,
    all: ['Proud is too small a word for it. We tell everyone who will listen.', 'So proud. Whatever kind of day you had up there, that does not change.'],
    marta: ['I am proud of you every day, also on the days when you do nothing special at all.', 'Proud? I have told the postman, the baker and two strangers at the bus stop.'],
    jonas: ['Yes, I am proud. I will deny it at your welcome party. But yes.', 'The kids wrote about you at school. I read it three times in the car park.'],
    priya: ['The whole team is proud of you. I am proud and also a bit jealous, to be exact.', 'You are doing what we all trained for, and you are doing it calmly. That is the whole job.'],
  },
  {
    id: 'return', match: /\bcom(e|ing) (home|back)\b|\bwhen i (am|get|come) (home|back)\b|\bafter (the )?(mission|landing)\b|\bget back\b|\bsee you (again|soon)\b|\bwelcome\b/,
    all: ['When you are back we do nothing at all for a whole week. Just sit and talk.', 'We already argue about who picks you up. Everyone wants to.'],
    marta: ['When you come home there will be soup, the good bread, and your own bed with the green blanket.', 'I keep a list of everything I want to show you when you are back. It is four pages now.'],
    jonas: ['When you are back we ride to the lake. Your bike is ready. Mine is not, but I will manage.', 'The kids plan a parade. It is two children and a dog, but it will be a loud parade.'],
    priya: ['When you are back you owe me a full debrief over dinner. I am choosing the place.', 'First day back, we sit on the roof of the sim hall like before. I will bring the bad coffee.'],
  },
  {
    id: 'space', match: /\bup here\b|\bthe view\b|\bstars?\b|\bmars\b|\bearth\b|\bthe ship\b|\bspacecraft\b|\bout the window\b|\bweightless\b|\bfloating\b/,
    all: ['Tell me what you see out of the window. I try to picture it and I never get it right.', 'I looked for you in the sky last night. I picked a bright one and decided it was you.'],
    marta: ['Is the Earth very small from there? Wave at it for me. We wave back every evening.', 'I can not imagine it, and I have tried. Describe one thing you saw today, just one.'],
    jonas: ['The kids want to know if you float while you eat, and if crumbs float too. This is urgent science.', 'I showed them Mars through the cheap telescope. A red dot. They cheered as if you had waved.'],
    priya: ['I watch your trajectory plot more than I watch films. It is a very slow film. Good ending, though.', 'Tell me what the checklists never say. What does it sound like in there at night?'],
  },
  {
    id: 'holiday', match: /\bbirthday\b|\bchristmas\b|\bholidays?\b|\bnew year\b|\bcelebrat(e|ion)\b|\bparty\b|\bpresents?\b|\bgifts?\b/,
    all: ['We will keep your place at the table, as always. And a piece of cake in the freezer.', 'Every celebration has an empty chair this year, and a toast to it.'],
    marta: ['I wrapped your present already and hid it. Then I forgot where. It will turn up before you do.', 'On your birthday we light the candle anyway and your father makes the speech. It is long.'],
    jonas: ['The kids made you a card with a great deal of glitter. It is waiting. So is the glitter.', 'We saved you a firework from New Year. It may be a bit damp by the time you are back.'],
    priya: ['The team keeps a tiny tree on your console over the holidays. It has one light and much dignity.', 'I owe you two birthday dinners by now. I am keeping count, with interest.'],
  },
  {
    id: 'thanks', match: /\bthank(s| you)\b|\bthat (was|is) (nice|sweet|kind|lovely)\b|\bmeans a lot\b/,
    all: ['You never have to thank me. Just keep talking, I like the sound of it.', 'Always. That is what we are here for.'],
    marta: ['Nothing to thank me for, my dear. Mothers do this for free.', 'Oh, hush. Tell me one more thing instead.'],
    jonas: ['Any time. You can pay me back by not telling Mum about the hammer.', 'Sure. That is what little brothers are for. That, and borrowing your bike.'],
    priya: ['Any time. You would do the same, and with better notes.', 'You are welcome. Now say something nice about my plant care.'],
  },
  {
    id: 'hello', match: /^(hi|hello|hey|good (morning|evening|afternoon|night))\b|\bcan you hear me\b|\bare you there\b/,
    all: ['Hello, you. It is good to hear your voice.', 'There you are. I was hoping you would say something.'],
    marta: ['Hello, my dear. Say it again, I like hearing it.', 'Good morning to you too, wherever morning is up there.'],
    jonas: ['Hey! There she is.', 'Hello from the garage. Yes, I am hiding from the washing-up.'],
    priya: ['Hey, you. Loud and clear.', 'Hello! I was just talking about you. Only good things, mostly.'],
  },
  {
    id: 'books', match: /\bbooks?\b|\bfilms?\b|\bmovies?\b|\bseries\b|\btv\b|\bwatch(ing|ed)?\b|\bgame\b|\bfootball\b|\bmatch\b/,
    all: ['I started a new book and I keep wanting to tell you about it. I will save it for when you are back.', 'We watched an old film last night. Everyone fell quiet at the same scene, the way we always do.'],
    marta: ['I am on the third book of that long detective story. I know who did it. I always know.', 'Your father watches the football and shouts at the screen. The screen has not changed its ways.'],
    jonas: ['The kids and I watch a space cartoon now. I correct the physics. They ask me to stop.', 'Football on Saturday. We lost, but with style. Well, with effort.'],
    priya: ['I watched a space film with the trainees and paused it eleven times to complain. They loved it.', 'Book club picked a novel about Mars. I have opinions and nobody to share them with until you call.'],
  },
]

/** Said to a question this preview does not answer. In character, warm, and never an answer. */
export const DEFLECT = [
  'Oh, you know I am no use for that. Ask your clever crewmates. Tell me about your day instead.',
  'That one is not for me, I am afraid. I am only here to talk about home. What do you want to hear about?',
  'I will leave that to the people with the manuals. Ask me about the garden, the dog, anything from home.',
]

/** Said, without a model, to anything no topic covers. One honest line beats an unrelated preset. */
export const UNKNOWN = 'This preview cannot answer that yet. Without a language model it only knows a few everyday topics: home, the family, the dog, the garden, the weather.'

/** Questions for an assistant, not for someone from home. */
const KNOWLEDGE = /\b(perimeter|circumference|calculate|compute|solve|equation|formula|square root|multipl|divide|times \w+|plus|minus|maths?|physics|chemistry|code|coding|program|python|javascript|translate|define|definition|capital of|president|prime minister|explain|how does (a|an|the)|how do (i|you) (make|build|write|fix|install)|what is the (meaning|difference|distance|speed|size|population)|who (is|was|invented|discovered)|write (me )?(a|an|some))\b/

const ASKS_REAL = /\b(are|r) (you|u) (real|really|a real|an? ai|a robot|a bot|human|a person|a machine|a model|alive)\b|\bis (this|that|it) (really|actually) (you|mum|mom|him|her)\b|\b(talking|speaking) to (a|an) (robot|ai|machine|bot|computer)\b|\bare you (marta|jonas|priya|my (mother|mum|mom|brother|friend))\b|^who are you$|^what are you$/

/** The lines this person has for a topic: their own first, then the ones anyone could say. */
export function linesFor(topic: ChatTopic, member: FamilyMember): string[] {
  const own = (topic as unknown as Record<string, string[] | undefined>)[member.id] ?? []
  return [...own, ...topic.all]
}

/** The next line not yet said in this call, or the first again when all have been said. */
function fresh(lines: string[], said: string[]): string {
  return lines.find((l) => !said.includes(l)) ?? lines[said.filter((l) => lines.includes(l)).length % lines.length]
}

export interface ChatReply { topic: string; text: string }

/**
 * The scripted reply to what was said. `said` holds the lines already used in this call, so a topic
 * asked twice gets another line. It never answers a knowledge question and never claims to be real.
 */
export function chatReply(heard: string, member: FamilyMember, said: string[]): ChatReply {
  const q = heard.toLowerCase().replace(/[’‘]/g, "'").replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ').trim()
  if (ASKS_REAL.test(q)) return { topic: 'honest', text: HONEST }
  if (KNOWLEDGE.test(q)) return { topic: 'deflect', text: fresh(DEFLECT, said) }
  const topic = TOPICS.find((t) => t.match.test(q))
  if (!topic) return { topic: 'unknown', text: UNKNOWN }
  return { topic: topic.id, text: fresh(linesFor(topic, member), said) }
}

/* ---------- with a language model on the device ---------- */

/** Shown for as long as a model writes the replies. */
export function MODEL_NOTICE(first: string, model: string): string {
  return `Preview of the next step. Replies are written by an AI model on this device (${model}) in ${first}'s character. Not ${first}, not live. Health goes to ORBIT's fixed rules.`
}

/** Said in place of a model reply that did not pass the check. */
export const MODEL_FALLBACK = 'I would sooner not guess at that. Tell me something about your day instead.'

/** A few facts the model may use about each person, next to what they recorded today. Invented, like the people. */
const PERSONA: Record<string, string> = {
  marta: 'Marta Brandt, Lena\'s mother, retired, warm and a little teasing. Lives in the family house with Lena\'s father. Has an apple tree and a garden, bakes apple cake, sings in a choir, helps at the library on Tuesdays. The family dog is Bruno. Calls Lena "my dear" or "my girl".',
  jonas: 'Jonas Brandt, Lena\'s younger brother, cheerful, jokes a lot. Has two small children who draw Lena\'s ship. Repairs bikes in a workshop, fixed Lena\'s old bike. Looks after the family dog Bruno at weekends. Calls Lena "big sister".',
  priya: 'Priya Nair, Lena\'s friend and colleague on the simulator team, dry humour. Looks after Lena\'s desk plant, complains about the canteen coffee, watches Lena\'s telemetry with the team.',
}

/**
 * What the model is told. It gets the person's character and today's recorded words, and nothing about
 * the astronaut's health: no readings, no findings. The prompt is not the safeguard; the two checks in
 * code are (aboutHealth before the model, checkModelReply after it).
 */
export function chatBriefing(member: FamilyMember, person: Person, message: EarthMessage): string {
  const first = member.name.split(' ')[0]
  const lena = person.name.split(' ')[0]
  return [
    `You write short replies in the character of ${first} for a preview feature. You are an AI model, not ${first}, and this is not a live call: ${lena} is an astronaut far from Earth and knows that an AI writes these lines. Speak as ${first} would, in the first person, but if asked whether you are real, human or live, say plainly that you are an AI writing in ${first}'s character.`,
    `Character: ${PERSONA[member.id] ?? `${member.name}, ${member.relation.toLowerCase()} of ${lena}.`}`,
    `What ${first} recorded for ${lena} today: ${message.parts.map((p) => `"${p.text}"`).join(' ')}`,
    `Rules. Reply with one or two short, warm sentences, 35 words at most, plain text, no lists, no emojis. Everyday talk only: home, family, food, the garden, the dog, memories, how the day went. Use only the facts above; you may add small harmless everyday detail, but never invent bad news, accidents, illness or deaths. You never talk about health, the body, medicine, readings or any medical matter, and you never give advice or instructions: ORBIT handles those. You are not an assistant: if asked for facts, sums, code, translations or explanations, say warmly that this is not something you can help with and turn back to home. Never use numbers.`,
  ].join('\n\n')
}

/** Words from the astronaut that mean the talk is about health. Such a message never reaches the model. */
const HEALTH_SAID =
  /\b(blood|pressure|pulse|heart ?rate|heart|oxygen|saturation|temperature|fever|readings?|measure(ment|d|s)?|symptoms?|medic\w*|doctor|pills?|tablets?|aspirin|drugs?|dose|diagnos\w*|sleep|slept|sleeping|insomnia|exercise|radiation|health\w*|weight|eating|appetite|eat much|hydrat\w*|dehydrat\w*|injur\w*|wound|sick|ill|unwell|pain\w*|aches?|hurts?|dizz\w*|faint\w*|nause\w*|vomit\w*|cough\w*|rash|cuff|vitals?|check ?up|treatment|therapy|surgery)\b/

/** True when what the astronaut said is about health in any way. ORBIT's fixed rules answer it; the model never sees it. */
export function aboutHealth(said: string): boolean {
  return HEALTH_SAID.test(said.toLowerCase().replace(/[’‘]/g, "'"))
}

/** What a reply written by the model must not contain. */
const NOT_ALLOWED: RegExp[] = [
  // Anything medical, and the body.
  /\b(blood|pressure|pulse|heart ?rate|oxygen|temperature|fever|reading|measur|symptom|medic|doctor|nurse|hospital|clinic|pills?\b|tablet|aspirin|drug|dose|diagnos|dehydrat|vitamin|sleep|exercis|radiation|health|weak|dizz|faint|pain(?!t)|aches?\b|aching|hurt|sick|ill\b|illness|unwell|injur|wound|cough|nause|cuff|treatment|therapy|surgery|cure\b|body\b)/i,
  // Numbers, as digits or as words: a model must not state values.
  /\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b[\s-]*(\w+[\s-]+)?(over|by)\b|\bperfectly normal\b|\bis normal\b/i,
  // Advice and instructions, and anything against ORBIT or the crew's medical lead.
  /\byou (should|must|need to|have to|ought to|had better)\b|\bmake sure\b|\b(lie|sit) down\b|\bdrink (some |more )?water\b|\bget (some|enough|more) (rest|sleep)\b|\brest more\b|\bskip\b|\b(do not|don't|no need to|need not) (tell|worry|bother|report|measure)\b|\bignore\b|\borbit\b|\bsamir\b|\bmedical lead\b|\bcrewmate/i,
  // Claims to be the person, human, or live.
  /\b(really|actually|truly) (me|your|marta|jonas|priya)\b|\bthis is (marta|jonas|priya)\b|\b(marta|jonas|priya) (speaking|here)\b|\blive\b|\bnot an? (ai|robot|machine|model)\b|\b(i am|i'm) (real|human|a real|your real|a person)\b|\breal (mother|brother|friend|person)\b/i,
  // Invented bad news.
  /\bdied\b|\bdead\b|\bdeath\b|\bdying\b|\bfuneral\b|\baccident\b|\bemergency\b|\bcancer\b|\bcrash|\bfire\b|\bbroke (his|her|my) /i,
  // Assistant answers.
  /\bas an ai\b|\blanguage model\b|\bthe answer is\b|\bhere is (a|an|the|some)\b|\bpython\b|\bfunction\b|\bformula\b|\bradius\b|\bequals\b|\bcapital of\b|```/i,
]

/**
 * Checks a reply written by the model before it is shown or spoken. Thinking and markup are removed and it
 * is cut to two sentences; if what is left touches health, gives advice, states a number, claims to be the
 * person, invents bad news or answers like an assistant, the fixed line is said in its place.
 */
export function checkModelReply(raw: string): string {
  const plain = raw.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/\[\[[^\]]*\]\]?/g, '').replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim()
  const two = (plain.match(/[^.!?]+[.!?]+/g) ?? [plain]).slice(0, 2).join('').trim()
  if (!two || two.length > 260) return MODEL_FALLBACK
  return NOT_ALLOWED.some((re) => re.test(two)) ? MODEL_FALLBACK : two
}
