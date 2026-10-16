"""Shared parser for the narration syntax used in 04_VIDEO_PRODUCTION/scripts/*.json.

    {#anchor}            marks the moment the next word starts (drives on-screen animation)
    [on screen|spoken]   captions show the first part, the voice says the second ("[54|fifty-four]")

parse(narration) -> (spoken_text, tokens, anchors)
    tokens:  [{"display": str, "spoken_words": [str, ...]}]  one per caption word
    anchors: {name: index of the token that follows the anchor}
"""
import re

BRACKET = re.compile(r'\[([^\]|]+)\|([^\]]+)\]')
ANCHOR = re.compile(r'\{#(\w+)\}')
GLUE = '\x00'


def parse(narration):
    # keep a bracket group in one whitespace chunk, whatever spaces its parts contain
    text = BRACKET.sub(lambda m: '[' + m.group(1).replace(' ', GLUE) + '|' + m.group(2).replace(' ', GLUE) + ']', narration)
    tokens, anchors, pending = [], {}, []
    for chunk in text.split():
        pending += ANCHOR.findall(chunk)
        chunk = ANCHOR.sub('', chunk)
        if not chunk:
            continue
        display = BRACKET.sub(lambda m: m.group(1), chunk).replace(GLUE, ' ')
        spoken = BRACKET.sub(lambda m: m.group(2), chunk).replace(GLUE, ' ')
        tokens.append({'display': display, 'spoken_words': spoken.split()})
        for a in pending:
            anchors[a] = len(tokens) - 1
        pending = []
    if pending:
        raise ValueError(f'anchor(s) {pending} not followed by a word')
    spoken = ' '.join(w for t in tokens for w in t['spoken_words'])
    return spoken, tokens, anchors


def display_text(narration):
    return ' '.join(t['display'] for t in parse(narration)[1])


if __name__ == '__main__':
    s, t, a = parse('Pasaron de [54|cincuenta y cuatro] {#r56}a [56|cincuenta y seis]. Fin «[ebook|i-book]» x')
    print(s)
    print([x['display'] for x in t])
    print(a)
