.PHONY: persist generate format lint

generate: SHELL := /bin/bash
generate:
	deno run --allow-read --allow-write --allow-net --allow-env --unstable ./src/index.ts

format: SHELL := /bin/bash
format:
	deno fmt --check --options-single-quote

format-fix: SHELL := /bin/bash
format-fix:
	deno fmt --options-single-quote

lint: SHELL := /bin/bash
lint:
	deno lint --unstable ./src/

persist: SHELL := /bin/bash
persist:
	git config --global user.name "GitHub Actions" &&\
	git config --global user.email "actions@github.com" &&\
	git add -A &&\
	if [ "$(git log -1 --pretty=%B)" = "chore: Update generated files" ]; then \
		git commit --amend --no-edit; \
	else \
		git commit -m "chore: Update generated files"; \
	fi &&\
	git push -f
