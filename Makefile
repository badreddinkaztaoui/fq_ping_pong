up:
	docker-compose up --build

down:
	docker-compose down -v

clean: down
	docker system prune -fa
	docker volume prune -fa