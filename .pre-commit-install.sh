#!/usr/bin/env sh
# shellcheck disable=SC2059

ERROR_RED='\033[1;31m'
PURPLE='\033[0;35m'
DIM='\033[2m'
CLEAR='\033[0m'

# Ensure pre-commit cli is installed
if ! command -v pre-commit > /dev/null 2>&1
then
  printf "${ERROR_RED}pre-commit executable not found!\n"
  printf "${PURPLE}Installing pre-commit with pip.\n\n${CLEAR}${DIM}"
  if command -v pip3 > /dev/null 2>&1
  then
    pip3 install pre-commit
  elif command -v pips > /dev/null 2>&1
  then
    pip install pre-commit
  else
    printf "${ERROR_RED}Could not install pre-commit: pip not found!\n" 1>&2
    printf "${ERROR_RED}Either install pre-commit, or install pip.\n${CLEAR}" 1>&2
    exit 127
  fi
  printf "\n${CLEAR}"
fi

# Ensure pre-commit hooks are installed
if [ ! -f ./.git/hooks/pre-commit ]; then
  printf "${ERROR_RED}Pre-commit hooks not installed!\n"
  printf "${PURPLE}Installing pre-commit hooks.\n${CLEAR}${DIM}"
  pre-commit install
  printf "\n"
else
  pre-commit install > /dev/null
fi
