# Rebuild and start all containers in the background
run:
	docker-compose down --remove-orphans
	docker-compose up --build -d

# Stop all containers
stop:
	docker-compose down

# Run the C++ blacklist server with custom arguments (pass ARGS="...")
run-server:
	docker-compose run --rm server $(ARGS)

# Open a shell inside the running C++ server container
server-shell:
	docker exec -it server2 bash

# Open a shell inside the Node.js app container
node-shell:
	docker exec -it server3 bash

# Open a shell inside the React frontend container
react-shell:
	docker exec -it frontend sh
