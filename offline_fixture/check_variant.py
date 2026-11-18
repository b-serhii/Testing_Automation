"""Two actual local UI browser checks; NOT runs against the real website or TS suite."""
from pathlib import Path
from playwright.sync_api import sync_playwright

file=(Path(__file__).parent/'variant1.html').resolve().as_uri()
out=Path(__file__).parent.parent/'evidence';out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for mode in ('first-first','last-first'):
  page=b.new_page(viewport={'width':1300,'height':800})
  page.goto(file)
  add=page.get_by_role('button',name='Add Element')
  delete=page.get_by_role('button',name='Delete')
  assert delete.count()==0
  for i in range(1,6):
   add.click();assert delete.count()==i,(mode,i)
  if mode=='first-first':
   delete.first.click();assert delete.count()==4
   delete.first.click();assert delete.count()==3
  else:
   delete.last.click();assert delete.count()==4
   delete.first.click();assert delete.count()==3
  page.screenshot(path=str(out/f'local-variant-{mode}.png'))
  print(f'PASS {mode}: 0→1→2→3→4→5→4→3')
  page.close()
 b.close()
print('2 passed (LOCAL Chromium fixture; tests written in Python, not TypeScript runner)')
