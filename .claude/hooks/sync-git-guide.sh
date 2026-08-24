#!/usr/bin/env bash
# 규칙 문서가 바뀌면 루트의 git-관련-사용법.html 갱신을 상기시킨다.
# PostToolUse(Write|Edit) 훅. stdin으로 훅 입력 JSON을 받는다.
# 이 저장소에는 jq가 없으므로 bash 내장 기능만 쓴다.
set -u

input=$(cat)

# "file_path":"..." 의 값만 뽑는다. 없으면 조용히 끝낸다.
case "$input" in
  *'"file_path"'*) ;;
  *) exit 0 ;;
esac
path=${input#*\"file_path\"}
path=${path#*\"}
path=${path%%\"*}
[ -z "$path" ] && exit 0

# Windows 경로 구분자를 슬래시로 정규화한다.
path=${path//\\//}

case "$path" in
  */AGENTS.md|AGENTS.md|*/CLAUDE.md|CLAUDE.md|*/README.md|README.md|*/.github/*|.github/*) ;;
  *) exit 0 ;;
esac

cat <<'JSON'
{"systemMessage":"규칙 문서가 바뀌었다. 루트 git-관련-사용법.html 도 확인할 것.","hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"방금 수정한 파일은 루트 git-관련-사용법.html 의 근거 문서다. 그 문서는 라벨 표, 브랜치 보호 설정, 이슈 템플릿 목록, 브랜치·PR 명령 예시를 이 파일들에서 옮겨 적은 것이다. 이번 변경이 그 내용과 어긋나는지 확인하고, 어긋나면 같은 PR에서 git-관련-사용법.html 도 함께 갱신하라. 어긋나지 않으면 아무것도 하지 않는다."}}
JSON
