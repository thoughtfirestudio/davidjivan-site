/* Shared arc data — used by index.html (module) and christianity-map.html (full walkthrough) */
window.ARC = {
  title: "The Arc",
  subtitle: "the intellectual history of Christianity",
  spine: "ANE substrate → Israelite religion → Second Temple Judaism → Historical Jesus → resurrection claims → Paul's vision → Jerusalem church → gospel formation → Christology",
  nodes: [
    {
      n: 1,
      name: "The ANE Substrate",
      short: "Storm god among gods",
      thesis: "A tribal warrior-storm god exists among the gods of the Canaanite pantheon.",
      ideas: [
        "Yahweh was one god among many — El, Baal, Asherah, and the divine council at Ugarit.",
        "The Enuma Elish: Marduk kills the chaos dragon Tiamat; creation from her corpse.",
        "The divine council: El Elyon divides the nations, and Yahweh receives Jacob as his portion (Deut 32:8-9).",
        "The Bible still preserves the older world: Psalm 82, the council, the plural in Genesis 1:26."
      ],
      chips: ["baal-cycle", "divine-council", "enuma-elish", "garden-of-eden", "adapa-myth", "sumerian-king-list"],
      roadmap: { url: "/bible", label: "the full bible roadmap" }
    },
    {
      n: 2,
      name: "Israelite Religion",
      short: "A tribal god becomes THE God",
      thesis: "Yahweh converges with El, absorbs Baal's storm, and wins the council. A tribal god becomes THE God.",
      ideas: [
        "Convergence with El: wisdom, mercy, creator-language — the high god's traits absorbed.",
        "Divergence with Baal: shared storm-god imagery becomes an exclusive claim.",
        "Asherah, the consort, worshipped beside Yahweh until the reforms removed her.",
        "Exile → Deutero-Isaiah: 'Yahwism went into exile; Judaism came back.' Monotheism was born in Babylon."
      ],
      chips: ["original-gods-of-israel", "mark-smith-early-history-god", "flood-source-criticism", "babylonian-flood-myth", "comparative-flood-myths"],
      roadmap: { url: "/bible", label: "the full bible roadmap" }
    },
    {
      n: 3,
      name: "Second Temple Judaism",
      short: "Apocalypse & ascent",
      thesis: "Apocalyptic expectation and Merkavah mysticism — the world the early movement swam in.",
      ideas: [
        "Not one Judaism — a world of Judaisms: Sadducees, Pharisees, Essenes, apocalypticists.",
        "The Dead Sea Scrolls: 4Q521's messianic language echoes almost verbatim in Jesus' message.",
        "Enoch ascends, is transformed into a quasi-angelic being — later Metatron, 'the lesser Yahweh.'",
        "Merkavah mysticism: ascent through the heavenly temple to behold the Glory. Elite, dangerous.",
        "Two powers in heaven — the boundary heresy Christianity was born inside."
      ],
      chips: ["second-temple-judaism", "ep-sanders", "paul-the-mystic"]
    },
    {
      n: 4,
      name: "Historical Jesus",
      short: "The apocalyptic preacher",
      thesis: "A Galilean apocalyptic Jew, an exorcist, executed by Rome as an insurgent messiah.",
      ideas: [
        "He joined John the Baptizer's immersion movement and radicalized it.",
        "Exorcism was the work — fighting Belial to force the kingdom's arrival.",
        "The Son of Man: Daniel 7, spoken in the third person — an apocalyptic figure, not a self-title.",
        "Crucified as an insurgent. The movement regrouped; James took the helm."
      ],
      chips: ["historical-jesus", "schweitzer-quest", "ep-sanders", "bart-ehrman", "synoptic-problem"]
    },
    {
      n: 5,
      name: "The Resurrection Claims",
      short: "The movement forms",
      thesis: "A movement forms claiming he was raised. The earliest creed lists the witnesses.",
      ideas: [
        "1 Cor 15:3-8 — the earliest creed: Cephas, the twelve, 500+ brothers, James, all the apostles. Then Paul.",
        "Something happened before Paul. The movement was already claiming to have seen him.",
        "The tradition develops: Mark has no appearances; Luke has flesh and bones; John has wounds.",
        "Wright reads an event. Allison reads an experience. Both agree the disciples were transformed."
      ],
      chips: ["resurrection-new-creation"]
    },
    {
      n: 6,
      name: "Paul's Vision",
      short: "The engine",
      thesis: "A persecutor becomes a mystic — his vision of Jesus as the Glory becomes the theological engine.",
      ideas: [
        "2 Cor 12: caught up to the third heaven, hearing unutterable words — Merkavah ascent.",
        "The third heaven is the holy of holies; the kavod — the divine Glory — dwells there.",
        "Paul sees Jesus as the kavod: the earliest Christology is enthronement, not incarnation.",
        "Faith democratizes ascent: transformation open to all, not just the mystics."
      ],
      chips: ["paul-the-mystic", "pauline-authorship"]
    },
    {
      n: 7,
      name: "The Jerusalem Church",
      short: "The road not taken",
      thesis: "James leads the Way — the Torah-observant movement that history lost.",
      ideas: [
        "James, Jesus' brother, centers the movement in Jerusalem.",
        "The Way: an apocalyptic, Torah-observant sect of Judaism — not yet a new religion.",
        "Three gospels emerged: John's, Jesus-James', Paul's. Only Paul's survived.",
        "The road not taken — the actual heirs of Jesus' own practice faded from history."
      ],
      chips: ["jerusalem-church", "ep-sanders", "paul-the-mystic"]
    },
    {
      n: 8,
      name: "Gospel Formation",
      short: "History becomes faith",
      thesis: "The Jesus of history becomes the Christ of faith — through sources, redaction, and development.",
      ideas: [
        "Mark first, then Matthew and Luke using Mark and Q; John last and most exalted.",
        "The resurrection narratives become more physical with each Gospel — Mark to John.",
        "The Gospels are ancient biography: significance over chronology.",
        "The historical Jesus and the Christ of faith were never identical."
      ],
      chips: ["synoptic-problem", "bart-ehrman", "historical-jesus"]
    },
    {
      n: 9,
      name: "Christology & the Trinity",
      short: "The cosmic Christ",
      thesis: "The cosmic Christ becomes the doctrine of God — exaltation, then incarnation, then creed.",
      ideas: [
        "From exaltation ('made Lord at the resurrection') to incarnation ('always divine') — the trajectory.",
        "Two powers in heaven becomes binitarian worship becomes Nicaea.",
        "The Cappadocian settlement: one essence, three persons, relations of origin.",
        "The Spirit: ruach to Paraclete to third person — the last to arrive, worshipped by 381."
      ],
      chips: ["trinity-development", "cappadocian-settlement", "filioque-controversy", "holy-spirit-pneumatology"]
    }
  ]
};
