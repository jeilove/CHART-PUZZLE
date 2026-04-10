import os

def check_and_fix_gemini_md():
    gemini_path = r'C:\Users\ACECOM\.gemini\GEMINI.md'
    rule_id = "[에이전트 개발 원칙 26]"
    new_rule = """
- [에이전트 개발 원칙 26] **코드 재사용성 및 가독성 확보 (Modularization & Documentation)**: 소스를 쉽게 찾고 재사용하기 위해 핵심 로직(백업, 인증, 데이터 처리 등)은 반드시 모듈화(`hooks`, `utils`, `services` 등)하고, 최상단에 버전과 기능을 명시적으로 문서화한다. 혼재된 이전 버전 소스와의 혼동을 방지하기 위해 '최종 버전'임을 주석 등으로 명확히 표기한다.
"""

    try:
        if not os.path.exists(gemini_path):
            print(f"Error: {gemini_path} does not exist.")
            return

        with open(gemini_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Check if already exists
        exists = any(rule_id in line for line in lines)
        
        if exists:
            print(f"Rule already exists in the file. Current file length: {len(lines)} lines.")
            # Print last 5 lines for confirmation
            print("--- Last 5 lines ---")
            for line in lines[-5:]:
                print(line.strip())
        else:
            print("Rule not found. Appending now...")
            with open(gemini_path, 'a', encoding='utf-8') as f:
                f.write(new_rule)
            print("Successfully appended Rule 26.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_and_fix_gemini_md()
