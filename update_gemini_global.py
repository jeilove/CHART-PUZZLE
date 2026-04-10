import os

def update_gemini_md():
    gemini_path = r'C:\Users\ACECOM\.gemini\GEMINI.md'
    
    new_rule = "\n- [에이전트 개발 원칙 26] **코드 재사용성 및 가독성 확보 (Modularization & Documentation)**: 소스를 쉽게 찾고 재사용하기 위해 핵심 로직(백업, 인증, 데이터 처리 등)은 반드시 모듈화(`hooks`, `utils`, `services` 등)하고, 최상단에 버전과 기능을 명시적으로 문서화한다. 혼재된 이전 버전 소스와의 혼동을 방지하기 위해 '최종 버전'임을 주석 등으로 명확히 표기한다.\n"

    try:
        # Check if rule already exists to avoid duplication
        with open(gemini_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if "[에이전트 개발 원칙 26]" in content:
                print("Rule 26 already exists. Skipping update.")
                return

        # Append the new rule
        with open(gemini_path, 'a', encoding='utf-8') as f:
            f.write(new_rule)
        print("Successfully added Rule 26 to GEMINI.md")

    except Exception as e:
        print(f"Error updating GEMINI.md: {e}")

if __name__ == "__main__":
    update_gemini_md()
