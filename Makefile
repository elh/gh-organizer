.PHONY: fetch
fetch:
	(cd backend; npx ts-node fetch.ts $(ORG) $(FETCHERS))

.PHONY: run-backend
run-backend-dev:
	(cd backend; npm run dev)

.PHONY: run-backend
run-frontend-dev:
	(cd frontend; npm start)

.PHONY: lint
lint:
	(cd backend; npm run lint)
	(cd frontend; npm run lint)
