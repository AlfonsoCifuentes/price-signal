#!/usr/bin/env node
// Generates one narration take per scene with ElevenLabs, plus the character alignment for exact captions.
//
//   EL_KEY=... node tools/elevenlabs_takes.js ../script_master.json out/takes
//
// Writes out/takes/<lang>/<NN>.mp3 (film) and <lang>/v<NN>.mp3 (vertical), and <same>.align.json next to each.
// The key is read from EL_KEY only; it is never written to disk. Voice IDs are set per language below.
const fs = require('fs');
const path = require('path');

const VOICES = {en: 'XAezqB2SuTKEhjCMe7Oy', es: 'LlZr3QuzbW4WrPjgATHG'};
const MODEL = 'eleven_multilingual_v2';
const [,, script, outRoot] = process.argv;
const key = process.env.EL_KEY;
if (!script || !outRoot || !key) {
  console.error('usage: EL_KEY=... node tools/elevenlabs_takes.js <script_master.json> <out-dir>');
  process.exit(1);
}

const master = JSON.parse(fs.readFileSync(script, 'utf8'));
const jobs = [];
for (const lang of ['en', 'es']) {
  const text = (s) => (lang === 'en' ? s.narration : s.es.narration);
  master.film.forEach((s, i) => jobs.push({lang, base: String(i + 1).padStart(2, '0'), text: text(s)}));
  master.vertical.forEach((s, i) => jobs.push({lang, base: `v${String(i + 1).padStart(2, '0')}`, text: text(s)}));
}

(async () => {
  for (const j of jobs) {
    const dir = path.join(outRoot, j.lang);
    fs.mkdirSync(dir, {recursive: true});
    const mp3 = path.join(dir, `${j.base}.mp3`);
    const alignFile = path.join(dir, `${j.base}.align.json`);
    if (fs.existsSync(mp3) && fs.existsSync(alignFile)) { console.log('cached', j.lang, j.base); continue; }
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[j.lang]}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
      body: JSON.stringify({text: j.text, model_id: MODEL,
        voice_settings: {stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true}}),
    });
    if (!r.ok) { console.log('FAIL', j.lang, j.base, r.status, (await r.text()).slice(0, 200)); process.exitCode = 1; continue; }
    const body = await r.json();
    fs.writeFileSync(mp3, Buffer.from(body.audio_base64, 'base64'));
    fs.writeFileSync(alignFile, JSON.stringify({text: j.text, alignment: body.alignment}, null, 1) + '\n');
    console.log('ok', j.lang, j.base, j.text.length, 'chars');
  }
})();
