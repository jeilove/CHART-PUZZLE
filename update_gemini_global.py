import os

target_path = r'C:\Users\ACECOM\.gemini\GEMINI.md'
new_rule = '- [에이전트 개발 원칙 21] 모든 버그 수정 및 기능 개선 사항은 작업 완료 후 반드시 프로젝트 루트의 CHANGELOG.md에 버전 번호와 상세 내용을 누적하여 기록한다. 이전 에이전트가 기록을 누락했더라도 현재 에이전트가 프로젝트 히스토리를 파악하여 정합성을 유지하며 기록해야 한다.'

try:
    with open(target_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if '에이전트 개발 원칙 21' in content:
        print("Rule 21 already exists.")
    else:
        # Ensure there is a newline at the end before adding
        with open(target_path, 'a', encoding='utf-8') as f:
            if not content.endswith('\n'):
                f.write('\n')
            f.write(new_rule + '\n')
        print("Rule 21 added successfully.")
except Exception as e:
    print(f"Error: {e}")
