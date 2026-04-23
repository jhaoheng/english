# Makefile: generate content/index.json
.PHONY: index

index:
	node scripts/generate-index.js
