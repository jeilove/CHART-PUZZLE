import os

def update_gemini():
    target_path = r"C:\Users\ACECOM\.gemini\GEMINI.md"
    new_rule = """
### 프로젝트 실행 배치 파일 생성 고도화
실행 배치 파일(run_*.bat)을 생성할 때는 매 실행 시마다 **기존에 작동 중인 모든 관련 프로세스(Node, Python, Uvicorn)** 및 포트를 점유한 좀비 프로세스를 자동으로 강제 종료(Taskkill)한 뒤 깨끗하게 새로 시작할 수 있도록 작성한다.
"""
    
    if not os.path.exists(target_path):
        print(f"Error: {target_path} not found.")
        return

    with open(target_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the best place to insert (near other batch file rules)
    insertion_point = "### 프로젝트 실행 배치 파일 생성시"
    if insertion_point in content:
        parts = content.split(insertion_point)
        # Insertion near the previous rule
        updated_content = parts[0] + new_rule + insertion_point + parts[1]
    else:
        # Append at the end if not found
        updated_content = content + "\n" + new_rule

    with open(target_path, "w", encoding="utf-8") as f:
        f.write(updated_content)
    
    print("GEMINI.md updated successfully.")

if __name__ == "__main__":
    update_gemini()
