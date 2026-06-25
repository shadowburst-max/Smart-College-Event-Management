# Engineering Design Document

This document covers the MongoDB schema design, the concurrency-control
strategy for event registration, and the hybrid AI/recommendation
architecture that powers personalized event discovery.

---

## 1. Database Schema

### `User`

```js
{
  _id: ObjectId,
  name: String,
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },
  interests: [String],
  createdAt: Date
}
```

`email` carries a unique index — every login and signup duplicate-check
filters directly on it, and Mongoose/MongoDB needs the index to enforce
uniqueness efficiently as the collection grows.

`interests` is stored as a flat string array rather than normalized into a
separate collection. Interests are low-cardinality, read-mostly, and always
consumed wholesale by the recommendation engine as a set to intersect
against event tags — never queried individually. A reference-based model
would cost a `$lookup` on every recommendation request for no real benefit.

### `Event`

```js
{
  _id: ObjectId,
  title: String,
  description: String,
  summary: String,        // AI-generated, see Section 3
  tags: [String],          // AI-generated, see Section 3
  category: String,
  eventDate: Date,
  maxSeats: Number,
  seatsLeft: Number,
  createdAt: Date
}
```

`summary` and `tags` are written once, at creation time, by the Gemini
enrichment step — not computed on every read. This is a deliberate
materialization: it trades a small amount of write-time latency and cost
for permanently fast reads (see Section 3).

A compound index on `{ eventDate: 1, seatsLeft: 1 }` backs the single most
frequent query in the system — *"upcoming events that still have seats"*
(`eventDate > now AND seatsLeft > 0`) — which is used by both the public
event listing and the recommendation engine's candidate pool. A compound
index lets MongoDB satisfy this conjunction in one index scan rather than
intersecting two separate single-field indexes.

### `Registration`

```js
{
  _id: ObjectId,
  user: { type: ObjectId, ref: "User", required: true },
  event: { type: ObjectId, ref: "Event", required: true },
  registeredAt: Date
}
```

**Compound unique index on `{ user: 1, event: 1 }`.** This is the
structural guarantee against double-booking, and it matters more than it
might first appear: an application-level "have they already registered?"
check is a *convenience* that produces a clean error message — it is not
what makes double-registration impossible. Two near-simultaneous requests
from the same user can both pass that check before either has written
anything. The unique index is what actually closes that gap: the second
insert attempt fails at the database layer with a duplicate-key error
(code `11000`), which the application catches and returns as a `409
Conflict`. Correctness here lives in the schema, not in application
control flow.

`Registration` is modeled as its own collection — not as an array embedded
in `User` or `Event` — because each document doubles as a timestamped,
queryable interaction record. (If a richer "students who also went to
similar events" feature is added later, this collection is already the
shape that kind of feature needs.)

---

## 2. Concurrency Control

### The problem

The naive way to decrement a seat count is a read-then-write:

```js
const event = await Event.findById(eventId);
if (event.seatsLeft > 0) {
  event.seatsLeft -= 1;
  await event.save();
}
```

This is a **check-then-act race condition**. With 2 seats left and a burst
of concurrent registration requests (a popular workshop opening
registration, for instance), every request can execute `findById` and read
`seatsLeft = 2` before *any* of them has written the decrement back. Every
request sees `2 > 0` and proceeds — the event silently oversells.

### The fix: a single atomic conditional update

Instead of reading and then deciding, the precondition and the mutation are
expressed as **one atomic database operation**:

```js
const event = await Event.findOneAndUpdate(
  { _id: eventId, seatsLeft: { $gt: 0 } },
  { $inc: { seatsLeft: -1 } },
  { new: true }
);

if (!event) {
  // The filter didn't match -- either the event doesn't exist, or
  // seatsLeft was already 0. Either way, no update happened, and no
  // race window existed for it to happen incorrectly.
  throw new NoSeatsAvailableError();
}
```

The key property: MongoDB evaluates the filter (`seatsLeft: { $gt: 0 }`)
and applies the update (`$inc: -1`) as a **single, indivisible operation**
at the storage-engine level for that document. No other operation can be
interleaved between "check the condition" and "apply the decrement" for
the same document — there is no window in which two concurrent requests can
both observe `seatsLeft > 0` and both proceed to decrement past zero.

This is *why no explicit locking is needed*: a traditional lock (e.g. SQL's
`SELECT ... FOR UPDATE`) exists to manually create this same
all-or-nothing guarantee across a read and a write that would otherwise be
two separate steps. `findOneAndUpdate` collapses the read and the write
into one step at the database layer, so there's nothing left to lock —
the atomicity is structural, not enforced by holding a resource open
across multiple round-trips.

If `seatsLeft` hits zero, every subsequent concurrent request's filter
simply fails to match, `findOneAndUpdate` returns `null`, and the
application returns a `409` — cleanly, with no overselling and no manual
lock management, lock timeouts, or deadlock handling to reason about.

### Defense in depth

This single atomic update is paired with the compound unique index from
Section 1: the index prevents the *same user* from acquiring two
registration records for the same event (a distinct failure mode from
overselling total seats), and it does so independently — even if the seat
decrement logic were ever modified incorrectly, double-booking by a single
user remains structurally impossible at the schema level.

---

## 3. AI & Recommendation Architecture

The standout design decision in this system is **where** the AI sits in the
request lifecycle. AI enrichment happens once, asynchronously, at
**write-time**. Recommendation ranking happens on every request, instantly,
at **read-time** — using plain JavaScript, not another LLM call. These are
two different problems, solved with two different tools, deliberately
chosen for the access patterns each one actually has.

### 3.1 Write-Time: LLM-Based Data Sanitization

When an admin creates an event with just a `title` and free-text
`description`, the backend makes a single call to the Gemini 2.5 Flash API
before saving the document:

```js
async function enrichEventWithAI(title, description) {
  const prompt = `
    Read the following event description and return strict JSON with:
    - "summary": a concise 2-sentence summary
    - "tags": an array of exactly 3 specific, lowercase topic tags

    Title: ${title}
    Description: ${description}
  `;

  const result = await geminiClient.generateContent(prompt);
  return JSON.parse(result.response.text()); // { summary, tags }
}
```

The returned `summary` and `tags` are saved directly onto the `Event`
document at creation time. This call happens **once per event**, not once
per page view — an event might be viewed and recommended thousands of
times over its lifetime, but Gemini is only ever invoked the single time
it's created or edited. The cost and latency of the LLM call are paid
exactly once, up front, and amortized over every future read.

This step also does real work beyond convenience: it normalizes
unstructured admin input (descriptions of wildly varying length, tone, and
detail) into a consistent, structured shape (`summary` + exactly 3 tags)
that the rest of the system — especially the recommendation engine — can
rely on having a predictable format.

### 3.2 Read-Time: Native Tag-Overlap Recommendation

Recommendations are computed with a synchronous, dependency-free JavaScript
function — no network call, no LLM, no external service:

```js
function getRecommendedEvents(userInterests, upcomingEvents, topN = 5) {
  const interestSet = new Set(userInterests.map(i => i.toLowerCase()));

  const scored = upcomingEvents.map(event => {
    const eventTags = event.tags.map(t => t.toLowerCase());
    const matchScore = eventTags.filter(tag => interestSet.has(tag)).length;
    return { event, matchScore };
  });

  return scored
    .filter(({ matchScore }) => matchScore > 0)   // drop zero-overlap noise
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, topN)
    .map(({ event }) => event);
}
```

This works *because* of the write-time enrichment step: every event already
has a clean, consistent `tags` array by the time it's a recommendation
candidate, so matching against a student's `interests` array is a plain set
intersection — an O(tags × interests) comparison per event, with no
external calls, no tokenization, and no model inference in the hot path.

### 3.3 Why This Split Is the Right Design

Calling an LLM on every recommendation request — e.g. "ask Gemini to rank
these 50 events for this student" — would mean:

- Real, user-facing latency on every single page load of the recommendation
  feed (an LLM round-trip vs. a sub-millisecond array operation).
- Real, recurring cost that scales with *traffic* (page views), rather than
  with *content* (events created).
- A point of failure on the read path: if the LLM API is slow or down, the
  recommendation feed breaks, even though nothing about the underlying data
  changed.

By contrast, this architecture's failure mode for an LLM outage is "a
newly created event temporarily has no AI-generated tags until the call
succeeds (or is retried)" — a graceful degradation, not an outage of a
core, frequently-used feature. The AI is doing the part of the job it's
actually suited for — interpreting unstructured natural language into
structured data — exactly once, and getting out of the way of every
subsequent read.

### 3.4 Cold Start Handling

A user with an empty `interests` array will have a `matchScore` of 0
against every event, and the `filter(matchScore > 0)` step removes all of
them — `getRecommendedEvents` correctly returns an empty array rather than
an arbitrary or misleading ranking. The recommendations route should detect
this case and fall back to a simple popularity ranking (most-registered
upcoming events) so a brand-new student with no stated interests still sees
a useful, non-empty feed on their first visit.
