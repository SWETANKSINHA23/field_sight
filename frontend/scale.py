import os, re

def scale_match(match):
    val = float(match.group(1))
    unit = match.group(2)
    new_val = round(val * 0.9, 3)
    if new_val.is_integer():
        return f'{int(new_val)}{unit}'
    return f'{new_val}{unit}'

def scale_svg_prop(m):
    prop = m.group(1)
    val = float(m.group(2))
    new_val = round(val * 0.9, 1)
    if new_val.is_integer():
        return f'{prop}="{int(new_val)}"'
    return f'{prop}="{new_val}"'

def scale_svg_attr(m):
    prop = m.group(1)
    val = float(m.group(2))
    new_val = round(val * 0.9, 1)
    if new_val.is_integer():
        return f'{prop}="{int(new_val)}"'
    return f'{prop}="{new_val}"'

for root, _, files in os.walk('d:/AI Product Intern/frontend/src'):
    for file in files:
        if file.endswith(('.css', '.js')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Scale px, rem, em
            new_content = re.sub(r'(\d+(?:\.\d+)?)(px|rem|em)', scale_match, content)
            
            # Scale SVG width/height
            new_content = re.sub(r'(width|height)="(\d+(?:\.\d+)?)"', scale_svg_prop, new_content)
            
            # Scale SVG rx, ry, cx, cy, r, x, y, x1, y1, x2, y2
            new_content = re.sub(r'\b(rx|ry|cx|cy|r|x|y|x1|y1|x2|y2)="(\d+(?:\.\d+)?)"', scale_svg_attr, new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f'Updated {path}')
