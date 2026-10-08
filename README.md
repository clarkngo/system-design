# Year One at Brightcart — System Design Field Training

Learn system design by living through it. You're a new engineer at a fictional marketplace, and over ten interactive incidents you make the call, see the consequences, and get debriefed. Each incident is modeled on a real public postmortem (GitHub, AWS, Facebook, GitLab, Cloudflare, Fastly, Slack, Discord and others).

**Live site:** https://clarkngo.github.io/system-design/

## Format

Every module follows the same loop:

1. **The page:** an incident cold open with alerts and logs
2. **Your call:** three decisions with branching outcomes (good / survivable / worse)
3. **Debrief:** the concepts, tied to what just happened
4. **Real postmortems:** what actually happened to real companies, with sources
5. **Your turn:** an open design challenge with hints and a rubric
6. **Live drill:** a prompt to run the incident unscripted with Claude as Game Master

Progress and scores are saved in the browser's `localStorage`.

## Structure

```
index.html            campaign hub and chapter list
modules/01–10         incident pages
assets/engine.js      decisions, gating, scoring, copy buttons (no dependencies)
styles.css            shared styles, light and dark
```

Static HTML/CSS/JS with no build step. To preview locally:

```bash
python3 -m http.server 8799
```
