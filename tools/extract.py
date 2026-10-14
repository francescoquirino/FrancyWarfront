import re,sys
s=open(sys.argv[1]).read()
blocks=re.findall(r'```(?:js|javascript)?\s*\n(.*?)```', s, re.S)
code=max(blocks,key=len) if blocks else s
open(sys.argv[2],'w').write(code); print(sys.argv[2], len(code))
