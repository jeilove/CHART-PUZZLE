import os

target_path = r'C:\Users\ACECOM\.gemini\GEMINI.md'
new_rule = '- [에이전트 개발 원칙 22] 서버리스 환경에서 대량 데이터 분석 등 배치 작업이 필요할 경우, GitHub Actions를 사용하여 주기적으로 작업을 수행하고 결과를 외부 데이터베이스(Neon, Supabase 등)에 저장하여 실시간 동기화를 보장한다.'

try:
    with open(target_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if '에이전트 개발 원칙 22' in content:
        print("Rule 22 already exists.")
    else:
        with open(target_path, 'a', encoding='utf-8') as f:
            if not content.endswith('\n'):
                f.write('\n')
            f.write(new_rule + '\n')
        print("Rule 22 added successfully.")
except Exception as e:
    print(f"Error: {e}")
