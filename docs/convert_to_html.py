import markdown
import sys

md_file = 'docs/MindCheck_Project_Documentation.md'
html_file = 'docs/MindCheck_Project_Documentation.html'

with open(md_file, 'r') as f:
    md_content = f.read()

html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'toc'])

html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>MindCheck AI — Project Documentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  
  body {{
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    line-height: 1.7;
    padding: 48px 64px;
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
  }}
  
  h1 {{
    font-size: 32px;
    font-weight: 700;
    color: #0f172a;
    margin: 40px 0 8px;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 8px;
  }}
  
  h2 {{
    font-size: 22px;
    font-weight: 600;
    color: #1e40af;
    margin: 36px 0 12px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
  }}
  
  h3 {{
    font-size: 17px;
    font-weight: 600;
    color: #334155;
    margin: 24px 0 8px;
  }}
  
  h4 {{
    font-size: 15px;
    font-weight: 600;
    color: #475569;
    margin: 16px 0 6px;
  }}
  
  p {{
    margin: 8px 0;
    font-size: 14px;
    color: #334155;
  }}
  
  ul, ol {{
    margin: 8px 0 8px 24px;
    font-size: 14px;
  }}
  
  li {{
    margin: 4px 0;
    color: #334155;
  }}
  
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 13px;
  }}
  
  th {{
    background: #1e40af;
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }}
  
  td {{
    padding: 8px 14px;
    border-bottom: 1px solid #e2e8f0;
  }}
  
  tr:nth-child(even) {{
    background: #f8fafc;
  }}
  
  code {{
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: #be185d;
    font-family: 'Courier New', monospace;
  }}
  
  pre {{
    background: #1e293b;
    color: #e2e8f0;
    padding: 16px 20px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 12px 0;
    font-size: 12px;
    line-height: 1.6;
  }}
  
  pre code {{
    background: transparent;
    color: #e2e8f0;
    padding: 0;
  }}
  
  hr {{
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 32px 0;
  }}
  
  strong {{
    font-weight: 600;
    color: #0f172a;
  }}
  
  em {{
    color: #64748b;
  }}

  @media print {{
    body {{
      padding: 24px 32px;
    }}
    h1 {{ page-break-before: always; }}
    h1:first-of-type {{ page-break-before: avoid; }}
    pre {{ white-space: pre-wrap; word-wrap: break-word; }}
  }}
</style>
</head>
<body>
{html_body}
</body>
</html>"""

with open(html_file, 'w') as f:
    f.write(html)

print(f"HTML generated: {html_file}")
