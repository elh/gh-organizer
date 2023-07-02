.PHONY: run-backend
run-backend-dev:
	(cd backend; npm run dev)

.PHONY: lint
lint:
	(cd backend; npm run lint)
