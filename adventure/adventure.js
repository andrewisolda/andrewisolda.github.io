(function () {
  const state = {
    confidence: "medium",
    rounds: 0,
    scope: "contained",
    ending: null
  };

  const story = {
    start: {
      text:
        "9:02 AM. Your laptop pings you with a notification for an email marked URGENT. You hesitantly open Outlook. “Need copy for this product brief. Make it pop. Can you get it to us by EOD?”\n\nAttachment: brief_vFINAL_final2_reallyfinal.docx",
      choices: [
        { label: "Ask clarifying questions like an adult.", to: "clarify" },
        { label: "Say “Absolutely” and immediately open a blank doc.", to: "blankDoc" },
        { label: "Reply with “Love it” and hope that buys you some time.", to: "loveIt" }
      ]
    },

    clarify: {
      effect: () => {
        state.confidence = "high";
        state.scope = "contained-ish";
      },
      text:
        "You ask for context that was conspicuously absent from the brief they sent: audience, CTA, channel, and a slightly-reworded version of “what the hell are we actually trying to do here?”\n\nA miracle occurs: they answer. Not fully, but it's enough to work with...probably.",
      choices: [
        { label: "Draft three options: safe, smart, spicy.", to: "threeOptions" },
        { label: "Build a messaging hierarchy—don't want to put the cart before the horse, right?", to: "hierarchy" }
      ]
    },

    blankDoc: {
      effect: () => {
        state.confidence = "medium-low";
        state.scope = "expanding";
      },
      text:
        "You open a new Word doc, staring blankly at glowing void before you. It stares back.\n\nYou type a headline. Delete it. Type another. Delete it.\n\nShit. This used to be easier.\n\nYou can feel your computer judging you.",
      choices: [
        { label: "Create a quick outline to stop the bleeding.", to: "outline" },
        { label: "Pop an Adderall and write whatever comes to mind. If it worked for Kerouac, it'll work for you.", to: "tightenLater" }
      ]
    },

    loveIt: {
      effect: () => {
        state.confidence = "bold (incorrect)";
        state.scope = "mystery";
      },
      text:
        "You reply “Love it.”\n\nStakeholder replies: “Amazing. Also legal has feedback already.”\n\nTime: 9:06 AM. Great start.",
      choices: [
        { label: "Ask what legal is optimizing for.", to: "legalOptimizing" },
        { label: "Pretend legal feedback is optional.", to: "pretendOptional" }
      ]
    },

    threeOptions: {
      text:
        "You deliver three options.\n\nThey choose… a fourth option. “Can we combine #1’s clarity, #2’s tone, and #3’s energy, but shorter?”\n\nYou let out a resigned sigh.",
      choices: [
        { label: "Reframe: propose a single north-star line + supporting points.", to: "northStar" },
        { label: "Agree and start blending ideas together, like some sort of idea smoothie.", to: "smoothie" }
      ]
    },

    hierarchy: {
      effect: () => {
        state.confidence = "high";
      },
      text:
        "You build a messaging hierarchy.\n\nStakeholder: “Wow. Good stuff. Can we add 11 more benefits?”\n\nYou think back to that circular breathing technique your therapist taught you. In for four, out for eight.\n\nThat's a little better.",
      choices: [
        { label: "Offer a cutline: 'If everything is important, nothing is.'", to: "cutline" },
        { label: "Add the benefits and quietly reduce font size. That should hold them off.", to: "reduceFont" }
      ]
    },

    outline: {
      text:
        "You outline: audience → promise → proof → CTA.\n\nIt’s not glamorous, but neither is filing for unemployment.\n\nThe client pings you again: “How's it coming along?”",
      choices: [
        { label: "Send a rough direction with rationale.", to: "roughDirection" },
        { label: "Say “In progress” and hope the outline counts as progress.", to: "countsAsProgress" }
      ]
    },

    tightenLater: {
      effect: () => {
        state.scope = "expanding";
      },
      text:
        "The Adderall is doing its thing. An unearned sense of confidence sprouts from deep within, making you feel warm and fuzzy.\n\nYou write fast, not even stopping to check what you're putting on the page.\n\nFuck it, let's see what they think.\n\nFeedback arrives shortly after: “This is great. Can we make it more premium but also more approachable, and also funnier but less casual?”",
      choices: [
        { label: "Translate feedback into 2 concrete edits and confirm.", to: "translateFeedback" },
        { label: "Say “Totally” and open the thesaurus like a cursed book.", to: "thesaurus" }
      ]
    },

    legalOptimizing: {
      effect: () => {
        state.confidence = "medium-high";
      },
      text:
        "You ask what legal is optimizing for.\n\nLegal responds with a list of forbidden words.\n\nSurprisingly, you can still say something. You just have to… vaguely gesture at it.",
      choices: [
        { label: "Rewrite with ‘could help’ energy and cleaner claims.", to: "safeClaims" },
        { label: "Move the bold promise to a subhead and let proof do the talking.", to: "proofTalk" }
      ]
    },

    pretendOptional: {
      effect: () => {
        state.confidence = "audacious";
        state.scope = "chaos";
      },
      text:
        "You pretend legal feedback is optional.\n\nIt is not.\n\nA calendar invite appears: “Legal Sync (30 min).\n\n”Welp. Looks like you gambled and lost.",
      choices: [
        { label: "Attend the sync. Bring your notebook and a slice of humble pie.", to: "legalSync" },
        { label: "Reschedule indefinitely. (Bold.)", to: "reschedule" }
      ]
    },

    northStar: {
      effect: () => {
        state.confidence = "high";
        state.scope = "contained";
      },
      text:
        "You propose a north-star line and 3 supporting proof points.\n\nThey say: “This is the first time I’ve understood our product.”\n\nTruth be told, this is the first time you've understood their product, too.",
      choices: [
        { label: "Lock it in and ship.", to: "endingApproved" },
        { label: "Add a bonus alt line for future-you.", to: "endingHero" }
      ]
    },

    smoothie: {
      effect: () => {
        state.confidence = "medium";
        state.scope = "expanding";
      },
      text:
        "You blend the options.\n\nIt’s workable.\n\nStakeholder: “Great. Now can we do 12 versions for different audiences?”\n\nYou feel a migraine coming on.",
      choices: [
        { label: "Push back with a simple matrix and a plan.", to: "endingMatrix" },
        { label: "Say yes and version like you've never versioned before.", to: "endingVersioning" }
      ]
    },

    cutline: {
      effect: () => {
        state.confidence = "high";
      },
      text:
        "You say, gently: “If everything is important, nothing is.”\n\nSilence.\n\nThey reply: “That’s fair.”\n\nYou have successfully negotiated with reality.",
      choices: [
        { label: "Prioritize 3 benefits and ship.", to: "endingApproved" },
        { label: "Turn the rest into a follow-up asset.", to: "endingSystem" }
      ]
    },

    reduceFont: {
      effect: () => {
        state.confidence = "medium-low";
        state.scope = "expanding";
      },
      text:
        "You add the benefits. The product brief now looks like it’s whispering.\n\nSomeone says: “Can we make it pop?”",
      choices: [
        { label: "Recommend splitting into two slides.", to: "endingSplit" },
        { label: "Accept the fact that you're giving Small Font Energy.", to: "endingTinyType" }
      ]
    },

    roughDirection: {
      effect: () => {
        state.confidence = "medium-high";
      },
      text:
        "You send a direction with rationale.\n\nStakeholder replies: “Love the thinking.”\n\nYour work has been perceived. Nice.",
      choices: [
        { label: "Write the draft with guardrails.", to: "endingApproved" },
        { label: "Ask for one more constraint to keep it clean.", to: "endingHero" }
      ]
    },

    countsAsProgress: {
      text:
        "You say “In progress.”\n\nThey respond with a thumbs up.\n\nA thumbs up is not feedback, but it is technically a form of communication.",
      choices: [
        { label: "Turn the outline into a draft.", to: "endingApproved" },
        { label: "Continue outlining until the deadline outlines you.", to: "endingOutline" }
      ]
    },

    translateFeedback: {
      effect: () => {
        state.confidence = "high";
        state.scope = "contained";
      },
      text:
        "You translate feedback into two concrete changes and confirm.\n\nThey say: “Yes. Exactly.”\n\nYou look around to see if anyone witnessed this historic event.",
      choices: [
        { label: "Implement changes and ship.", to: "endingApproved" },
        { label: "Add a second option for safety.", to: "endingHero" }
      ]
    },

    thesaurus: {
      effect: () => {
        state.confidence = "medium-low";
        state.scope = "chaos";
      },
      text:
        "You consult the thesaurus.\n\nNow everything sounds like a luxury candle brand.\n\nStakeholder: “This feels… expensive.”\n\nYou are not sure that’s good.",
      choices: [
        { label: "Pull it back to plain language + strong proof.", to: "proofTalk" },
        { label: "Double down. Become the candle.", to: "endingCandle" }
      ]
    },

    safeClaims: {
      effect: () => {
        state.confidence = "high";
      },
      text:
        "You rewrite with safer claims and cleaner phrasing.\n\nLegal approves.\n\nYou feel your shoulders relax slightly.",
      choices: [{ label: "Ship it.", to: "endingApproved" }]
    },

    proofTalk: {
      effect: () => {
        state.confidence = "high";
      },
      text:
        "You let proof do the talking.\n\nLess promise, more receipts.\n\nEveryone nods. This is the closest thing to peace.",
      choices: [{ label: "Ship it.", to: "endingApproved" }]
    },

    legalSync: {
      effect: () => {
        state.confidence = "medium-high";
      },
      text:
        "You attend the legal sync.\n\nIt’s fine. Everyone is human. Mostly.\n\nYou leave with three safe phrases and a renewed respect for commas.",
      choices: [{ label: "Rewrite accordingly and ship.", to: "endingApproved" }]
    },

    reschedule: {
      effect: () => {
        state.confidence = "temporary";
        state.scope = "volcanic";
      },
      text:
        "You reschedule indefinitely.\n\nLegal does not buy your attempt at calendar jazz.\n\nA new invite arrives: “Legal Sync (now).”",
      choices: [
        { label: "Join. Immediately.", to: "legalSync" },
        { label: "Run away and start a goat farm.", to: "endingGoats" }
      ]
    },

    // Endings
    endingApproved: {
      ending: "approved",
      text:
        "Ending: Approved in (almost) one round.\n\nYou ship. It gets approved.\n\nYou live to see another day.\n\nNice work.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingHero: {
      ending: "hero",
      text:
        "Ending: The One Good Question.\n\nYour single clarifying question prevented three weeks of scope creep.\n\nSomewhere, a project manager feels a sudden warmth. They don’t know why.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingMatrix: {
      ending: "matrix",
      text:
        "Ending: The Matrix.\n\nYou propose a simple versioning matrix. Everyone agrees.\n\nYou remain a person, not a content vending machine. You'll take that as a win any day.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingVersioning: {
      ending: "versions",
      text:
        "Ending: 12 Versions Later.\n\nYou deliver all versions.\n\nA stakeholder asks for “one more, but slightly friendlier.”\n\nYou wonder if losing your versionity was this annoying for other people.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingSystem: {
      ending: "system",
      text:
        "Ending: The System Thinker.\n\nYou turn extra benefits into a follow-up asset.\n\nStakeholder: “This is so helpful.”\n\nYou: “Thank you.” (You mean it. Mostly.)",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingSplit: {
      ending: "split",
      text:
        "Ending: The Two-Slide Solution.\n\nYou split the content. Everything breathes.\n\nSomeone says “Now it pops.”\n\nYou accept your new identity as a Pop Star.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingTinyType: {
      ending: "tinytype",
      text:
        "Ending: Small Font Energy.\n\nYou reduce the font. Again.\n\nYou’ve created an award-winning slide that can only be read by ants.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingOutline: {
      ending: "outline",
      text:
        "Ending: Outline Eternal.\n\nYou keep outlining.\n\nThe deadline arrives, impressed by your structure but unconvinced by its usefulness.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingCandle: {
      ending: "candle",
      text:
        "Ending: Luxury Candle Brand.\n\nYour copy is now ‘elevated.’\n\nNo one knows what it means, but it smells expensive.\n\nLegal approves, because legal also enjoys candles.",
      choices: [{ label: "Play again", to: "start", count: false }]
    },

    endingGoats: {
      ending: "goats",
      text:
        "Ending: The Goat Farm.\n\nYou quit your job and start a goat farm. At least the goats don't have strong opinions about CTAs.\n\nOddly, the client still emails you.",
      choices: [{ label: "Play again", to: "start", count: false }]
    }
  };

  const els = {
    text: document.getElementById("text"),
    choices: document.getElementById("choices"),
    confidence: document.getElementById("confidence"),
    rounds: document.getElementById("rounds"),
    scope: document.getElementById("scope"),
    restart: document.getElementById("restart"),
    copyEnding: document.getElementById("copy-ending"),
    status: document.getElementById("status"),
    runId: document.getElementById("run-id")
  };

  function renderMeta() {
    els.confidence.textContent = state.confidence;
    els.rounds.textContent = String(state.rounds);
    els.scope.textContent = state.scope;
  }

  function clearStatus() {
    if (els.status) els.status.textContent = "";
  }

  function setStatus(msg) {
    if (!els.status) return;
    els.status.textContent = msg;
    setTimeout(clearStatus, 1500);
  }

  function setRunId() {
    const id = Math.random().toString(16).slice(2, 6).toUpperCase();
    if (els.runId) els.runId.textContent = "Run " + id;
  }

  function loadFromURL() {
    const params = new URLSearchParams(location.search);
    const node = params.get("node");
    if (node && story[node]) return node;
    return "start";
  }

  function updateURL(nodeKey) {
    const url = new URL(location.href);
    url.searchParams.set("node", nodeKey);
    history.replaceState(null, "", url);
  }

  function go(nodeKey) {
    const node = story[nodeKey];
    if (!node) return;

    if (typeof node.effect === "function") node.effect();
    if (node.ending) state.ending = node.ending;

    if (els.text) els.text.textContent = node.text;
    if (els.choices) els.choices.innerHTML = "";

    (node.choices || []).forEach((c) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = c.label;

      btn.addEventListener("click", () => {
        // Count rounds only here (one per choice)
        state.rounds += 1;
        renderMeta();
        updateURL(c.to);
        go(c.to);
      });

      li.appendChild(btn);
      if (els.choices) els.choices.appendChild(li);
    });

    renderMeta();
  }

  if (els.restart) {
    els.restart.addEventListener("click", () => {
      state.confidence = "medium";
      state.rounds = 0;
      state.scope = "contained";
      state.ending = null;
      setRunId();
      updateURL("start");
      go("start");
      setStatus("Restarted.");
    });
  }

  if (els.copyEnding) {
    els.copyEnding.addEventListener("click", async () => {
      const url = new URL(location.href);
      try {
        await navigator.clipboard.writeText(url.toString());
        setStatus("Link copied.");
      } catch {
        setStatus("Couldn’t copy. (Browsers are like that.)");
      }
    });
  }

  // Init
  setRunId();
  const first = loadFromURL();
  updateURL(first);
  go(first);
})();
