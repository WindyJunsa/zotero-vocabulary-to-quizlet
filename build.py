"""Build the XPI and source archive with Python's standard library."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent
manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
app = manifest['applications']['zotero']
for field in ('id', 'update_url', 'strict_min_version', 'strict_max_version'):
    if not app.get(field):
        raise ValueError(f'Missing manifest field: {field}')
if not app['update_url'].startswith('https://'):
    raise ValueError('Zotero requires HTTPS updates')
runtime = ['manifest.json', 'bootstrap.js', 'core.js', 'review.xhtml',
           'review.js', 'review.css', 'vocabulary.js', 'vocabulary.css',
           'vocabulary.svg', 'locale/en-US/vocabulary-to-quizlet.ftl',
           'locale/zh-CN/vocabulary-to-quizlet.ftl']
source = runtime + ['README.md', 'LICENSE', '.gitignore', 'build.py',
                    'test.cjs', 'vocabulary.test.cjs', 'updates.json',
                    '.github/workflows/check.yml']
destination = ROOT / 'dist'
destination.mkdir(exist_ok=True)
for suffix, files in [('xpi', runtime), ('source.zip', source)]:
    target = destination / f'vocabulary-to-quizlet-{manifest["version"]}.{suffix}'
    with ZipFile(target, 'w', compression=ZIP_DEFLATED) as archive:
        for filename in files:
            archive.write(ROOT / filename, filename)
    with ZipFile(target) as archive:
        assert archive.testzip() is None
        assert json.loads(archive.read('manifest.json')) == manifest
    print('Built dist/' + target.name)
