# janky arg passing...
.PHONY: fetch
fetch:
	(cd backend; npx ts-node fetch.ts $(MODE) $(OWNER) $(FETCHERS) $(REPOPRIVACY))

.PHONY: run-backend-dev
run-backend-dev:
	(cd backend; npm run dev)

.PHONY: run-frontend-dev
run-frontend-dev:
	(cd frontend; npm start)

.PHONY: lint
lint:
	(cd backend; npm run lint)
	(cd frontend; npm run lint)

.PHONY: deploy
deploy:
	(cd frontend; npm run deploy)
