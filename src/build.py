#!/usr/bin/env python3
"""Build the single-file tracker: python3 src/build.py  ->  index.html

template.html holds the shell with {{STYLE}}, {{DATA}} and {{APP}} slots.
No dependencies, no minifier: the output is readable and diff-friendly.
"""
import base64
import hashlib
import io
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'index.html')
DATA = ['data0.js', 'data1.js', 'data2.js', 'data3.js']


def read(name):
    with io.open(os.path.join(HERE, name), encoding='utf-8') as f:
        return f.read()


def sha(text):
    return "'sha256-%s'" % base64.b64encode(hashlib.sha256(text.encode('utf-8')).digest()).decode()


def csp(page):
    """Content-Security-Policy for the built page.

    The page talks to nothing: no network, no fonts, no frames, no forms. Inline <script> and <style>
    blocks are allowed only by their SHA-256 hash, so injected markup cannot run script. Inline style
    attributes (used by the rendered views) are allowed; they cannot execute code.
    """
    scripts = [sha(m) for m in re.findall(r'<script>(.*?)</script>', page, re.S)]
    styles = [sha(m) for m in re.findall(r'<style>(.*?)</style>', page, re.S)]
    return '; '.join([
        "default-src 'none'",
        'script-src ' + ' '.join(scripts),
        "style-src 'unsafe-inline'",
        'style-src-elem ' + ' '.join(styles),
        "style-src-attr 'unsafe-inline'",
        'img-src data: blob:',
        "connect-src 'none'",
        "font-src 'none'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
    ])


def main():
    page = read('template.html')
    for slot in ('{{STYLE}}', '{{DATA}}', '{{APP}}'):
        if page.count(slot) != 1:
            sys.exit('template.html must contain %s exactly once' % slot)
    js = ''.join(read(n) for n in DATA)
    app = read('app.js')
    for part in (js, app):
        if '</script' in part.lower():
            sys.exit('a source file contains "</script", which would end the page script early')
    page = page.replace('{{STYLE}}', read('style.css')).replace('{{DATA}}', js).replace('{{APP}}', app)
    page = page.replace('{{CSP}}', csp(page))
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write(page)
    print('wrote %s (%d bytes)' % (OUT, len(page.encode('utf-8'))))


if __name__ == '__main__':
    main()
