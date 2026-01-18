(function () {
  const state = {
    ending: null
  };

  const story = {
    start: {
      text:
        "9:02 AM. Your laptop pings you with a notification for an email marked URGENT. You hesitantly open Outlook and are greeted with a message from an important client. \"Need copy for this product brief. Make it pop. Can you get it to us by EOD?\"\n\nAttachment: brief_vFINAL_final2_reallyfinal.docx",
      choices: [
        { label: "Ask clarifying questions like an adult.", to: "clarify" },
        { label: "Say \"Absolutely\" and immediately open a blank doc.", to: "blankDoc" },
        { label: "Reply with \"Love it\" and hope that buys you some time.", to: "loveIt" }
      ]
    },

    clarify: {
      text:
        "You ask for context that was conspicuously absent from the brief they sent: audience, CTA, channel, and a slightly-reworded version of \"what the hell are we actually trying to do here?\"\n\nA miracle occurs: they answer. Not fully, but it's enough to work with...probably.",
      choices: [
        { label: "No time for outlines—draft three options, each with different tones.", to: "threeOptions" },
        { label: "Build a messaging hierarchy—don't want to get too ahead of yourself, right?", to: "hierarchy" }
      ]
    },

    blankDoc: {
      text:
        "You open a new Word doc. You stare blankly at the glowing void before you. It stares back.\n\nYou type a headline. Delete it. Type another. Delete it.\n\nShit. This used to be easier.\n\nYou can feel your computer judging you.",
      choices: [
        { label: "Piecemeal a quick outline to stop the bleeding.", to: "outline" },
        { label: "Pop an Adderall and write whatever comes to mind. If it worked for Kerouac, it'll work for you.", to: "tightenLater" }
      ]
    },

    loveIt: {
      text:
        "You reply \"Love it.\"\n\nThe client replies: \"Amazing. Also legal has notes they want to make sure are incorporated into the draft.\"\n\nTime: 9:06 AM. Great start.",
      choices: [
        { label: "Ask what legal is optimizing for.", to: "legalOptimizing" },
        { label: "Pretend legal feedback is optional and start writing.", to: "pretendOptional" }
      ]
    },

    threeOptions: {
      text:
        "You deliver three options.\n\nThey choose a fourth. \"Can we combine #1's clarity, #2's tone, and #3's energy, but shorter?\"\n\nYou let out a resigned sigh.",
      choices: [
        { label: "Reframe your approach: propose a single north-star headline with supporting points that incorporate aspects from each option.", to: "northStar" },
        { label: "Agree and start blending your copy together as if you're making the world's worst smoothie.", to: "smoothie" }
      ]
    },

    hierarchy: {
      text:
        "You build a messaging hierarchy.\n\nClient: \"Good start. Can we add 11 more benefits?\"\n\nYou think back to that circular breathing technique your therapist taught you. In for four, out for eight.\n\nThat's a little better.",
      choices: [
        { label: "Send a reply: 'If everything is important, nothing is.'", to: "cutline" },
        { label: "Add the additional benefits and quietly reduce the font size. That should hold them off.", to: "reduceFont" }
      ]
    },

    outline: {
      text:
        "Searching for inspiration, you think back to the halcyon days of college. Ah, those were the days…having a social life, not getting hungover from drinking one light beer, feeling like the horizons of your life stretched outward to infinity. The \"Best of Maroon 5\" playlist blasting from your office's ceiling speakers snaps you out of the trance.\n\nFocus.\n\nIt's a fuzzy memory, but you recall the \"universal outline\" your Marketing 101 professor taught you: audience → promise → proof → CTA. That should do for now.\n\nIt's not glamorous, but neither is filing for unemployment.\n\nThe client pings you again, this time on Teams: \"How's it coming along?\"\n\nTeams, email…they're hitting you from all angles today. You eye the window by your desk, just in case the client sends you a carrier pigeon with a \"just checking in\" note tied to its leg.",
      choices: [
        { label: "Send a rough direction and back it up with rationale.", to: "roughDirection" },
        { label: "Say \"In progress\" and hope the outline counts as progress.", to: "countsAsProgress" }
      ]
    },

    tightenLater: {
      text:
        "The Adderall is doing its thing. A sense of confidence, possibly unearned, sprouts from deep within you.\n\nYou write quickly. The page fills sooner than you thought it would. You send it to the client without a second look.\n\nFeedback arrives shortly after: \"This is great. Can we make it more premium but also more approachable, and also funnier but less casual?\"",
      choices: [
        { label: "Translate feedback into 2 concrete edits and confirm.", to: "translateFeedback" },
        { label: "Say \"Totally\" and crack open the thesaurus on your desk.", to: "thesaurus" }
      ]
    },

    legalOptimizing: {
      text:
        "You ask what legal is optimizing for.\n\nLegal responds with a list of forbidden words.\n\nAt this point, it feels like you'll need to vaguely gesture at product benefits rather than state them outright.",
      choices: [
        { label: "Add \"could help\" before every benefit that's listed.", to: "safeClaims" },
        { label: "\"Rewrite\" the draft by moving the bold promise to a subhead. Hopefully they don't check too closely.", to: "safeClaims" }
      ]
    },

    pretendOptional: {
      text:
        "You pretend legal feedback is optional and start writing.\n\nAfter sending your first draft, a calendar invite appears: \"Legal Sync (30 min).\"\n\nWelp. Looks like you gambled and lost.",
      choices: [
        { label: "Attend the sync.", to: "legalSync" },
        { label: "Attempt to reschedule the sync indefinitely.", to: "reschedule" }
      ]
    },

    northStar: {
      text:
        "You propose a north-star line and 3 supporting proof points.\n\nThey say: \"This is the first time I've understood our product.\"\n\nTruth be told, this is the first time you've understood their product, too.",
      choices: [
        { label: "Lock it in and send the final draft.", to: "endingApproved" },
        { label: "Add a bonus alt line for some extra credit.", to: "endingHero" }
      ]
    },

    smoothie: {
      text:
        "You blend the options.\n\nIt's workable. You think that if it were a real smoothie, it'd probably taste like that grayish protein goop that YouTubers are paid to hawk to 14-year-olds.\n\nClient: \"Great. Now can we do 12 versions for different audiences?\"\n\nYou feel a migraine coming on.",
      choices: [
        { label: "Push back with a simple messaging matrix and a plan.", to: "endingMatrix" },
        { label: "Reply with \"Absolutely!\"", to: "endingVersioning" }
      ]
    },

    cutline: {
      text:
        "You reply, as gently as possible: \"If everything is important, nothing is.\"\n\nA response comes in: \"That's fair.\"\n\nYou have successfully negotiated with reality.",
      choices: [
        { label: "Pick 3 benefits to prioritize and send it back for review.", to: "endingApproved" },
        { label: "Offer to deliver a follow-up asset at a later date.", to: "endingSystem" }
      ]
    },

    reduceFont: {
      text:
        "You add the benefits. The product brief now looks like it's whispering.\n\nSomeone in the email chain asks: \"Can we make it pop?\"",
      choices: [
        { label: "Recommend splitting the content over two pages instead of one.", to: "endingSplit" },
        { label: "Ignore the question entirely.", to: "endingTinyType" }
      ]
    },

    roughDirection: {
      text:
        "You send a direction with rationale.\n\nClient replies: \"Love the thinking.\"\n\nYour work has been perceived. Cool.",
      choices: [
        { label: "Write your draft with your initial direction as the foundation.", to: "endingApproved" },
        { label: "Ask for one more constraint because you're still feeling iffy about what the product does.", to: "endingHero" }
      ]
    },

    countsAsProgress: {
      text:
        "You say \"In progress.\"\n\nThey respond with a thumbs up.\n\nAt least you have some heads-down time now.",
      choices: [
        { label: "Turn the outline into a workable draft.", to: "endingApproved" },
        { label: "Indulge in your perfectionist streak and continue outlining.", to: "endingOutline" }
      ]
    },

    translateFeedback: {
      text:
        "You translate feedback into two concrete changes and confirm.\n\nThey say: \"Perfect. Approved.\"\n\nYou look around to see if anyone witnessed this historic event.",
      choices: [
        { label: "Implement the changes and send it off to the client.", to: "endingApproved" },
        { label: "Add a second option for safety.", to: "endingHero" }
      ]
    },

    thesaurus: {
      text:
        "You consult your trusty thesaurus as you scan over your draft.\n\nThe product brief now reads like the script for a perfume commercial.\n\n\"This feels… expensive,\" the client replies.\n\nYou are not sure that's good.",
      choices: [
        { label: "Go back to basics with plain, clear, human language.", to: "safeClaims" },
        { label: "Double down.", to: "endingCandle" }
      ]
    },

    safeClaims: {
      text:
        "You rewrite the product brief with safer claims and cleaner phrasing.\n\nLegal approves.\n\nYou feel your shoulders relax slightly.",
      choices: [{ label: "Send it off and mark it as \"done.\"", to: "endingApproved" }]
    },

    legalSync: {
      text:
        "You attend the legal sync.\n\nIt's not as much of a bloodbath as you expected.\n\nYou leave with a renewed respect for how slippery the English language can be when you put your mind to it.",
      choices: [{ label: "Rewrite accordingly and send it back to Legal for approval.", to: "endingApproved" }]
    },

    reschedule: {
      text:
        "You reschedule indefinitely.\n\nLegal does not buy your attempt at calendar jazz.\n\nA new invite arrives: \"Legal Sync (now).\"",
      choices: [
        { label: "Join. Immediately.", to: "legalSync" },
        { label: "Run away and start a goat farm.", to: "endingGoats" }
      ]
    },

    // Endings
    endingApproved: {
      ending: "approved",
      text:
        "Ending: Approved in (Almost) One Round.\n\nYour draft gets approved, and you live to see another day.\n\nNice work.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingHero: {
      ending: "hero",
      text:
        "Ending: The One Good Question.\n\nYour single clarifying question prevented three weeks of scope creep.\n\nYour project manager feels a sudden warmth. They don't know why.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingMatrix: {
      ending: "matrix",
      text:
        "Ending: The Matrix.\n\nYou propose a simple versioning matrix. Everyone agrees.\n\nYou'll take that as a win any day.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingVersioning: {
      ending: "versions",
      text:
        "Ending: 12 Versions Later.\n\nYou deliver all versions.\n\nThe client asks for \"one more, but slightly friendlier.\"\n\nYou make a joke about \"losing your versionity\" to the coworker next to you. They report you to HR. At least you won't have to think about this brief ever again if you get fired.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingSystem: {
      ending: "system",
      text:
        "Ending: The System Thinker.\n\nYou offer to turn the extra benefits into a follow-up asset to be delivered at a later date.\n\nClient: \"Great idea. Let's circle back on this next week.\"\n\nYou are now able to procrastinate a little longer. You acknowledge that you will be in this exact situation again once next week comes. You don't care.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingSplit: {
      ending: "split",
      text:
        "Ending: The Two-Pager.\n\nYou split the content into two pages. Everything breathes.\n\nSomeone says \"Now it pops.\"\n\nYou are now a Pop Star. You appreciate sequins, so this feels fitting.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingTinyType: {
      ending: "tinytype",
      text:
        "Ending: Small Font Energy.\n\nYou've created a killer product brief that can only be read by ants.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingOutline: {
      ending: "outline",
      text:
        "Ending: Outline Eternal.\n\nYou keep outlining.\n\nThe deadline arrives, and all you have to show for it is a half-baked outline. You get a calendar invite from your boss: \"Performance Chat.\" Gulp.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingCandle: {
      ending: "candle",
      text:
        "Ending: Lap of Luxury.\n\nYour copy is now 'elevated.' Too bad the product brief is for a B2B software solution.\n\nThe benefits have become so obfuscated by your flowery prose that they actually follow Legal's guidelines.\n\nThey approve your draft, surprisingly. Turns out someone on the legal team is a big fan of poetry.",
      choices: [{ label: "Play again", to: "start" }]
    },

    endingGoats: {
      ending: "goats",
      text:
        "Ending: The Goat Farm.\n\nYou quit your job and start a goat farm. At least the goats don't have strong opinions about CTAs.\n\nOddly, the client still emails you.",
      choices: [{ label: "Play again", to: "start" }]
    }
  };

  const els = {
    text: document.getElementById("text"),
    choices: document.getElementById("choices"),
    restart: document.getElementById("restart"),
    copyEnding: document.getElementById("copy-ending"),
    status: document.getElementById("status"),
    runId: document.getElementById("run-id")
  };

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
    if (els.runId) els.runId.textContent = "Session " + id;
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

    if (node.ending) state.ending = node.ending;

    if (els.text) els.text.textContent = node.text;
    if (els.choices) els.choices.innerHTML = "";

    (node.choices || []).forEach((c) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = c.label;

      btn.addEventListener("click", () => {
        updateURL(c.to);
        go(c.to);
      });

      li.appendChild(btn);
      if (els.choices) els.choices.appendChild(li);
    });
  }

  if (els.restart) {
    els.restart.addEventListener("click", () => {
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
        setStatus("Couldn't copy. (Browsers are like that.)");
      }
    });
  }

  // Init
  setRunId();
  const first = loadFromURL();
  updateURL(first);
  go(first);
})();
