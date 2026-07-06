/* ============================================================================
   POLARIS CRM DEMO — sample data (single source of truth)
   Simulated white-labelled sub-account for "Harbourview Dental" (fictional).
   Every number on every screen derives from here so it all reconciles.
   ========================================================================== */
window.PD = {
  clinic: "Harbourview Dental",
  me: { n: "Maya Chen", role: "Front Desk" },
  staff: [
    { n: "Dr. Elena Marsh", c: "#2563EB" },
    { n: "Dr. Tomas Reid", c: "#7C3AED" },
    { n: "Priya Nair", c: "#16A34A" },
    { n: "Maya Chen", c: "#D97706" }
  ],

  /* ---- pipeline: New Patient Pipeline ---- */
  stages: ["New Enquiry", "Contacted", "Consultation Booked", "Showed Up", "Treatment Proposed"],
  opps: [
    { id: "o1", n: "Amara Osei", v: 450, st: 0, days: 2, tag: "whitening", owner: 3 },
    { id: "o2", n: "Chloe Bennett", v: 180, st: 0, days: 1, tag: "gbp-call", owner: 3, chat: 1 },
    { id: "o3", n: "Yuki Yamamoto", v: 600, st: 0, days: 4, tag: "extraction", owner: 0 },
    { id: "o4", n: "Marcus Reed", v: 4200, st: 0, days: 1, tag: "invisalign-enquiry", owner: 1 },
    { id: "o5", n: "Liam O'Connor", v: 4200, st: 1, days: 3, tag: "invisalign-enquiry", owner: 1, chat: 1 },
    { id: "o6", n: "Grace Whitmore", v: 180, st: 1, days: 5, tag: "recall-due", owner: 2 },
    { id: "o7", n: "Tom Ellery", v: 3700, st: 1, days: 6, tag: "implant", owner: 0 },
    { id: "o8", n: "Daniel Park", v: 3800, st: 2, days: 2, tag: "referral-received", owner: 0, chat: 1 },
    { id: "o9", n: "Nadia Rahman", v: 360, st: 2, days: 1, tag: "family", owner: 2 },
    { id: "o10", n: "Peter Lindqvist", v: 180, st: 3, days: 0, tag: "new-patient", owner: 0 },
    { id: "o11", n: "Marcus Reed", v: 6400, st: 4, days: 4, tag: "veneers", owner: 1 },
    { id: "o12", n: "Isabelle Fournier", v: 7360, st: 4, days: 7, tag: "full-arch", owner: 0 }
  ],
  closed: { won: { count: 9, value: 9870 }, lost: { count: 3, value: 3480, reason: "Chose a practice closer to home" }, abandoned: { count: 1 } },
  funnel: [["New Enquiry", 25], ["Contacted", 19], ["Consultation Booked", 14], ["Showed", 11], ["Treatment Proposed", 9]],
  apptStat: { booked: 42, showRate: 88 },

  tasks: [
    { t: "Call back Chloe Bennett", due: "Overdue", over: true },
    { t: "Chase Daniel Park's referral letter", due: "Due today" },
    { t: "Order whitening kits", due: "Fri" }
  ],
  manualActions: 2,

  /* ---- conversations (newest first) ---- */
  threads: [
    { id: "t1", n: "Liam O'Connor", ch: "sms", unread: true, time: "12m", tags: ["invisalign-enquiry", "fb-lead"],
      msgs: [
        { who: "in", tx: "Hi, saw your Invisalign post — how long does treatment usually take?", tm: "9:02 am" },
        { who: "out", tx: "Hi Liam! Usually 6–14 months depending on the case. A consult is the quickest way to know — want me to hold a slot this week?", tm: "9:06 am" },
        { who: "in", tx: "Does the consult cost anything?", tm: "9:14 am", new: true }
      ] },
    { id: "t2", n: "Nadia Rahman", ch: "sms", time: "1h", tags: ["family"],
      msgs: [
        { who: "in", tx: "Can I move the kids' checkups to the same afternoon? School run is chaos", tm: "8:20 am" },
        { who: "out", tx: "Of course — I've put Aisha at 3:30 and Omar at 4:00 next Tuesday. Both confirmed ✓", tm: "8:24 am" }
      ] },
    { id: "t3", n: "Daniel Park", ch: "wa", time: "3h", tags: ["referral-received", "implant"],
      msgs: [
        { who: "out", tx: "Hi Daniel — you're confirmed for your implant consult Thu 2:00 pm with Dr. Marsh. Bring any recent X-rays if you have them.", tm: "6:41 am", auto: true },
        { who: "in", tx: "Confirmed, see you Thursday 👍", tm: "6:58 am" }
      ] },
    { id: "t4", n: "Hana Mori", ch: "sms", time: "1d", tags: ["no-show-recovery"],
      msgs: [
        { who: "out", tx: "Hi Hana, we missed you at your appointment today. Life happens! Reply here and we'll find you a new time this week.", tm: "Yesterday", auto: true, wf: "No-Show Recovery — 5 Touch" },
        { who: "in", tx: "So sorry!! Friday morning would be great if possible", tm: "Yesterday" },
        { who: "out", tx: "No problem at all — Friday 9:00 am with Priya is yours. See you then!", tm: "Yesterday" }
      ] },
    { id: "t5", n: "Chloe Bennett", ch: "call", time: "2d", tags: ["gbp-call"],
      msgs: [
        { who: "call", tx: "Missed Call", tm: "2 days ago" },
        { who: "out", tx: "Hi Chloe, this is Harbourview Dental — sorry we missed your call! Reply here or book directly: hvd.link/book", tm: "2 days ago", auto: true, wf: "Missed Call → Instant Text-Back" },
        { who: "in", tx: "Oh great, I'll book online. Thanks!", tm: "2 days ago" }
      ] },
    { id: "t6", n: "Grace Whitmore", ch: "em", time: "2d", tags: ["recall-due"],
      msgs: [
        { who: "out", tx: "Hi Grace, it's been 6 months since your last hygiene visit — Wednesday 11:00 is open with Priya if that suits. One tap to book: hvd.link/book", tm: "2 days ago", auto: true, wf: "6-Month Hygiene Recall" },
        { who: "in", tx: "Booked — thank you for the nudge!", tm: "2 days ago" }
      ] },
    { id: "t7", n: "Marcus Reed", ch: "em", time: "3d", tags: ["veneers"],
      msgs: [
        { who: "out", tx: "Marcus — attached is the treatment plan we discussed, costs itemised page 2. No rush; questions welcome.", tm: "3 days ago", att: "Treatment-plan.pdf" },
        { who: "in", tx: "Received, will read over the weekend. Appreciate the detail.", tm: "3 days ago" }
      ] },
    { id: "t8", n: "Dr. Elena Marsh", ch: "int", time: "3d", tags: [],
      msgs: [
        { who: "note", tx: "@Dr. Marsh can you take an emergency at 3? Walk-in with a cracked crown.", tm: "3 days ago" },
        { who: "note", tx: "Yes — move my 3:15 admin block. Send them in.", tm: "3 days ago" }
      ] }
  ],

  /* ---- calendar: week grid, hours 8..18 ---- */
  appts: [
    { d: 0, h: 9, len: 1, n: "Peter Lindqvist", t: "New Patient Exam", who: 0, st: "Showed" },
    { d: 0, h: 11, len: 1, n: "Sarah Okonkwo", t: "Hygiene", who: 2, st: "Showed" },
    { d: 0, h: 14, len: 1, n: "Jonas Weber", t: "Whitening", who: 1, st: "No Show" },
    { d: 1, h: 8, len: 1, n: "Emily Zhang", t: "Hygiene", who: 2, st: "Confirmed" },
    { d: 1, h: 13, len: 1, n: "Robert Fenwick", t: "Emergency", who: 0, st: "Confirmed" },
    /* tomorrow(d=1) 10:30 on Dr. Reid deliberately EMPTY — the simulation books it */
    { d: 2, h: 11, len: 1, n: "Grace Whitmore", t: "Hygiene", who: 2, st: "Confirmed" },
    { d: 2, h: 15, len: 1, n: "Aria Novak", t: "Invisalign Consult", who: 1, st: "Confirmed" },
    { d: 3, h: 14, len: 1, n: "Daniel Park", t: "Implant Consult", who: 0, st: "Confirmed" },
    { d: 3, h: 10, len: 1, n: "Oliver Danes", t: "Hygiene", who: 2, st: "Confirmed" },
    { d: 4, h: 9, len: 1, n: "Hana Mori", t: "Hygiene", who: 2, st: "Confirmed" },
    { d: 4, h: 12, len: 1, n: "Felix Arnaud", t: "New Patient Exam", who: 1, st: "Confirmed" },
    { d: 1, h: 15, len: 1, n: "Nadia Rahman — Aisha", t: "Child Check-up", who: 2, st: "Confirmed" },
    { d: 1, h: 16, len: 1, n: "Nadia Rahman — Omar", t: "Child Check-up", who: 2, st: "Confirmed" },
    { d: 4, h: 14, len: 1, n: "Isabelle Fournier", t: "Full-Arch Review", who: 0, st: "Confirmed" }
  ],

  /* ---- automation ---- */
  wfs: [
    { n: "Missed Call → Instant Text-Back", pub: true, enr: 47, upd: "2 days ago", open: true },
    { n: "No-Show Recovery — 5 Touch", pub: true, enr: 12, upd: "5 days ago" },
    { n: "New Patient Nurture — 7 Day", pub: true, enr: 31, upd: "1 week ago" },
    { n: "6-Month Hygiene Recall", pub: true, enr: 204, upd: "2 weeks ago" },
    { n: "Post-Visit Review Request", pub: true, enr: 89, upd: "2 weeks ago" },
    { n: "Database Reactivation — Dormant 12mo+", pub: false, enr: 0, upd: "yesterday" }
  ],
  wfNodes: [
    { k: "trigger", t: "Call Status", d: "Direction = Incoming · Status = No Answer / Voicemail", stat: "Fired 47 times" },
    { k: "sms", t: "Send SMS", d: "\"Hi {{contact.first_name}}, this is Harbourview Dental — sorry we missed your call! Reply here or book directly: hvd.link/book\"", stat: "Delivered 98% · Replied 41%" },
    { k: "wait", t: "Wait", d: "Until reply · timeout 30 min", stat: "" },
    { k: "if", t: "If / Else — Replied?", d: "YES → Send SMS (booking link) + Add Contact Tag \"missed-call-recovered\"", d2: "NO → Send Internal Notification (Front Desk) + Add Task \"Call back within the hour\"", stat: "" }
  ],
  enroll: [
    { n: "Chloe Bennett", at: "Jul 3rd 2026, 9:14 am", why: "Call Status", st: "finished" },
    { n: "Ben Okafor", at: "Jul 2nd 2026, 4:02 pm", why: "Call Status", st: "finished" },
    { n: "Rita Kaplan", at: "Jul 2nd 2026, 11:48 am", why: "Call Status", st: "finished" },
    { n: "Sam Whittle", at: "Jul 1st 2026, 2:31 pm", why: "Call Status", st: "finished" },
    { n: "Lena Baros", at: "Jun 30th 2026, 9:55 am", why: "Call Status", st: "finished" },
    { n: "Aldo Ricci", at: "Jun 30th 2026, 8:12 am", why: "Call Status", st: "processing" }
  ],

  /* ---- reputation ---- */
  rep: {
    goals: [30, 50], received: 23, delta: 4, avg: 4.8, sms: 41, em: 17,
    trend: [9, 11, 14, 12, 19, 23],
    reviews: [
      { n: "R. Calloway", src: "google", stars: 5, tx: "Chipped a molar on a Sunday — they had me in Monday 9am. Zero fuss.", d: "2 days ago" },
      { n: "M. Osei", src: "google", stars: 5, tx: "Painless hygiene visit, reminders actually work.", d: "4 days ago" },
      { n: "T. Nguyen", src: "fb", stars: 5, tx: "Front desk answered my message at 9pm. Booked by 9:05.", d: "1 week ago" },
      { n: "J. Weber", src: "google", stars: 3, tx: "Waited 20 minutes past my slot.", d: "1 week ago",
        draft: "Hi Jonas — you're right, Tuesday ran late and that's on us. We've added buffer time to the afternoon schedule. Thank you for telling us straight." },
      { n: "P. Lindqvist", src: "google", stars: 5, tx: "First visit. Everything explained before anything was done.", d: "2 weeks ago" },
      { n: "A. Novak", src: "fb", stars: 5, tx: "The reminder texts saved me twice already.", d: "2 weeks ago" }
    ],
    requests: [
      { n: "Peter Lindqvist", ch: "sms", d: "Today", st: "Clicked" },
      { n: "Sarah Okonkwo", ch: "sms", d: "Today", st: "Sent" },
      { n: "Grace Whitmore", ch: "em", d: "2 days ago", st: "Clicked" }
    ]
  },

  /* ---- the simulated contact ---- */
  sofia: { n: "Sofia Tanaka", phone: "07700 900982", value: 180, type: "Emergency Exam" }
};
