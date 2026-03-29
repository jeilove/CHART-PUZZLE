import os

target_file = r"C:\Users\ACECOM\.gemini\GEMINI.md"
new_content = """
- [에이전트 디버깅 원칙 10] **백엔드 핫 리로드(Hot Reload) 실패 및 좀비 프로세스 대처**: 코드 수정 후에도 (API 연결 오류 등이) 반영되지 않고 증상이 동일하다면, 프레임워크의 자동 재시작이 OS 환경과 충돌하여 이전 프로세스가 포트를 점유한 채 고착(Zombie)되었을 확률이 매우 높음. 이때는 코드를 계속 수정하며 의심하지 말고, 실행 중인 터미널을 완전히 강제 종료하거나 포트를 점유한 프로세스를 Kill한 후 새로 시작할 것.
- [에이전트 디버깅 원칙 11] **글로벌 디버그 히스토리(GLOBAL_DEBUG_HISTORY) 운영**: 모든 프로젝트에서 공통적으로 발생하는 치명적인 버그나 고착화된 디버깅 사례(좀비 프로세스 등)는 `C:/Users/ACECOM/.gemini/GLOBAL_DEBUG_HISTORY.md`에 누적하여 기록하고 상시 참조하여 동일한 삽질을 방지할 것.
"""

try:
    with open(target_file, "a", encoding="utf-8") as f:
        f.write(new_content)
    print("SUCCESS: Content appended successfully.")
except Exception as e:
    print(f"FAILED: {e}")
