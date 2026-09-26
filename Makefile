# ============================================================
# Pet Adoption - Docker Makefile
# ============================================================

SHELL := /bin/bash

COMPOSE := docker compose --env-file .env.production

PROJECT_NAME := pet_adoption
HOSTNAME := localhost
PORT := 8443
URL := https://$(HOSTNAME):$(PORT)

# ============================================================
# Colors
# ============================================================

RESET  := \033[0m
BOLD   := \033[1m
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
BLUE   := \033[34m

.DEFAULT_GOAL := up


# ============================================================
# Help
# ============================================================

help:
	@printf "\n"
	@printf "%b\n" "$(CYAN)$(BOLD)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "%b\n" "$(CYAN)$(BOLD)        PET ADOPTION - DOCKER COMMANDS$(RESET)"
	@printf "%b\n" "$(CYAN)$(BOLD)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "\n"

	@printf "%b\n" "$(GREEN)make$(RESET)              Start the project"
	@printf "%b\n" "$(GREEN)make build$(RESET)        Build all Docker images"
	@printf "%b\n" "$(GREEN)make re$(RESET)           Full rebuild + start"
	@printf "%b\n" "$(GREEN)make check$(RESET)        Check Docker, containers and endpoints"
	@printf "%b\n" "$(GREEN)make status$(RESET)       Show container status"
	@printf "%b\n" "$(GREEN)make logs$(RESET)         Follow all container logs"

	@printf "\n"

	@printf "%b\n" "$(YELLOW)make restart$(RESET)      Recreate containers"
	@printf "%b\n" "$(YELLOW)make stop$(RESET)         Stop all containers"
	@printf "%b\n" "$(YELLOW)make backend-stop$(RESET) Stop only the backend"
	@printf "%b\n" "$(YELLOW)make backend-up$(RESET)   Start the backend again"
	@printf "%b\n" "$(YELLOW)make alert$(RESET)        Stop backend for alert testing"
	@printf "%b\n" "$(YELLOW)make seed$(RESET)         Reset database and seed"

	@printf "\n"

	@printf "%b\n" "$(RED)make erase$(RESET)        Remove containers, volumes and images"

	@printf "\n"

	@printf "%b\n" "$(BLUE)Website:$(RESET) $(URL)"

	@printf "\n"


# ============================================================
# Normal startup
# ============================================================

up:
	@printf "\n"
	@printf "%b\n" "$(CYAN)▶ Starting Pet Adoption...$(RESET)"
	@$(COMPOSE) build
	@$(COMPOSE) up -d

	@printf "\n"
	@printf "%b\n" "$(CYAN)▶ Waiting for Petopia to be ready...$(RESET)"
	@until [ "$$(docker inspect -f '{{.State.Health.Status}}' pet_adoption_frontend 2>/dev/null)" = "healthy" ]; do \
		sleep 2; \
	done

	@printf "%b\n" "$(GREEN)✔ Project is running$(RESET)"
	@printf "%b\n" "$(BLUE)→ $(URL)$(RESET)"

	@printf "\n"



# ============================================================
# Build
# ============================================================

build:
	@printf "\n"
	@printf "%b\n" "$(CYAN)▶ Building Docker images...$(RESET)"
	@$(COMPOSE) build
	@printf "%b\n" "$(GREEN)✔ Images built successfully$(RESET)"
	@printf "\n"


# ============================================================
# Open Petopia
# ============================================================

open:
	@printf "\n"
	@printf "%b\n" "$(CYAN)▶ Opening Petopia...$(RESET)"
	@./scripts/open-petopia.sh
	@printf "\n"


# ============================================================
# Full rebuild
# ============================================================

re:
	@printf "\n"
	@printf "%b\n" "$(CYAN)$(BOLD)▶ FULL REBUILD$(RESET)"
	@printf "%b\n" "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "\n"

	@printf "%b\n" "$(YELLOW)1. Stopping existing containers...$(RESET)"
	@$(COMPOSE) down

	@printf "\n"
	@printf "%b\n" "$(YELLOW)2. Rebuilding Docker images without cache...$(RESET)"
	@$(COMPOSE) build --no-cache

	@printf "\n"
	@printf "%b\n" "$(YELLOW)3. Starting the project...$(RESET)"
	@$(COMPOSE) up -d --force-recreate

	@printf "\n"
	@printf "%b\n" "$(GREEN)✔ Full rebuild completed$(RESET)"
	@printf "%b\n" "$(BLUE)→ $(URL)$(RESET)"
	@printf "\n"


# ============================================================
# Restart
# ============================================================

restart:
	@printf "\n"
	@printf "%b\n" "$(CYAN)▶ Restarting Pet Adoption containers...$(RESET)"
	@$(COMPOSE) up -d --force-recreate
	@printf "\n"
	@printf "%b\n" "$(GREEN)✔ Containers recreated successfully$(RESET)"
	@printf "%b\n" "$(BLUE)→ $(URL)$(RESET)"
	@printf "\n"


# ============================================================
# Stop
# ============================================================

stop:
	@printf "%b\n" "$(YELLOW)▶ Stopping all containers...$(RESET)"
	@$(COMPOSE) stop
	@printf "%b\n" "$(GREEN)✔ Containers stopped$(RESET)"


# ============================================================
# Backend control
# ============================================================

backend-stop:
	@printf "%b\n" "$(YELLOW)▶ Stopping backend...$(RESET)"
	@$(COMPOSE) stop backend
	@printf "%b\n" "$(GREEN)✔ Backend stopped$(RESET)"

backend-up:
	@printf "%b\n" "$(CYAN)▶ Starting backend...$(RESET)"
	@$(COMPOSE) start backend
	@printf "%b\n" "$(GREEN)✔ Backend started$(RESET)"


# ============================================================
# Alert testing
# ============================================================

alert:
	@printf "\n"
	@printf "%b\n" "$(YELLOW)$(BOLD)⚠ ALERT TEST$(RESET)"
	@printf "%b\n" "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "\n"

	@printf "%b\n" "Stopping backend to trigger the monitoring alert..."
	@$(COMPOSE) stop backend

	@printf "\n"
	@printf "%b\n" "$(YELLOW)Backend is now DOWN.$(RESET)"
	@printf "\n"

	@printf "%b\n" "Prometheus should detect the backend failure."
	@printf "\n"

	@printf "%b\n" "After testing, run:"
	@printf "\n"
	@printf "%b\n" "    $(GREEN)make backend-up$(RESET)"
	@printf "\n"


# ============================================================
# Status
# ============================================================

status:
	@printf "\n"
	@printf "%b\n" "$(CYAN)$(BOLD)CONTAINER STATUS$(RESET)"
	@printf "%b\n" "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@$(COMPOSE) ps
	@printf "\n"


# ============================================================
# Logs
# ============================================================

logs:
	@$(COMPOSE) logs -f

logs-backend:
	@$(COMPOSE) logs -f backend

logs-frontend:
	@$(COMPOSE) logs -f frontend


# ============================================================
# Health / verification
# ============================================================

check:
	@printf "\n"
	@printf "%b\n" "$(CYAN)$(BOLD)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "%b\n" "$(CYAN)$(BOLD)             PET ADOPTION CHECK$(RESET)"
	@printf "%b\n" "$(CYAN)$(BOLD)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "\n"

	@printf "Docker........................ "
	@if docker info >/dev/null 2>&1; then \
		printf "%b\n" "$(GREEN)OK$(RESET)"; \
	else \
		printf "%b\n" "$(RED)FAILED$(RESET)"; \
		exit 1; \
	fi

	@printf "Docker Compose................ "
	@if docker compose version >/dev/null 2>&1; then \
		printf "%b\n" "$(GREEN)OK$(RESET)"; \
	else \
		printf "%b\n" "$(RED)FAILED$(RESET)"; \
		exit 1; \
	fi

	@printf "Production environment........ "
	@if [ -f .env.production ]; then \
		printf "%b\n" "$(GREEN)OK$(RESET)"; \
	else \
		printf "%b\n" "$(RED)FAILED$(RESET)"; \
		exit 1; \
	fi

	@printf "\n"
	@printf "%b\n" "$(CYAN)Containers:$(RESET)"
	@$(COMPOSE) ps

	@printf "\n"
	@printf "%b\n" "$(CYAN)Endpoints:$(RESET)"

	@printf "Petopia HTTPS................. "
	@if curl -k -fsS \
		--resolve "$(HOSTNAME):$(PORT):127.0.0.1" \
		--max-time 5 \
		"$(URL)" >/dev/null 2>&1; then \
		printf "%b\n" "$(GREEN)OK$(RESET)"; \
	else \
		printf "%b\n" "$(RED)FAILED$(RESET)"; \
	fi

	@printf "Backend readiness.............. "
	@if $(COMPOSE) exec -T backend \
		node -e "fetch('http://127.0.0.1:3000/ready').then(async r => { const j = await r.json(); if (!r.ok || j.status !== 'ready' || !j.db?.ok) process.exit(1); }).catch(() => process.exit(1)" \
		>/dev/null 2>&1; then \
		printf "%b\n" "$(GREEN)OK$(RESET)"; \
	else \
		printf "%b\n" "$(RED)FAILED$(RESET)"; \
	fi

	@printf "\n"
	@printf "%b\n" "$(GREEN)$(BOLD)Check completed.$(RESET)"
	@printf "\n"


# ============================================================
# Database reset / seed
# ============================================================

seed:
	@printf "\n"
	@printf "%b\n" "$(YELLOW)$(BOLD)⚠ DATABASE RESET / SEED$(RESET)"
	@printf "%b\n" "$(YELLOW)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "\n"

	@printf "%b\n" "This will:"
	@printf "%b\n" "  • Stop the project"
	@printf "%b\n" "  • Remove Docker volumes"
	@printf "%b\n" "  • Recreate the database"
	@printf "%b\n" "  • Run the seed process"

	@printf "\n"
	@printf "%b" "Continue? Type 'yes' to continue: "; \
	read -r confirm; \
	if [ "$$confirm" != "yes" ]; then \
		printf "%b\n" "$(GREEN)Cancelled.$(RESET)"; \
		exit 0; \
	fi

	@printf "\n"
	@printf "%b\n" "$(YELLOW)▶ Removing volumes...$(RESET)"
	@$(COMPOSE) down --volumes

	@printf "\n"
	@printf "%b\n" "$(YELLOW)▶ Recreating project...$(RESET)"
	@$(COMPOSE) up -d --build

	@printf "\n"
	@printf "%b\n" "$(GREEN)✔ Database reset and project recreated.$(RESET)"
	@printf "%b\n" "$(BLUE)→ $(URL)$(RESET)"
	@printf "\n"


# ============================================================
# Remove everything
# ============================================================

erase:
	@printf "\n"
	@printf "%b\n" "$(RED)$(BOLD)⚠ DANGER: FULL CLEANUP$(RESET)"
	@printf "%b\n" "$(RED)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(RESET)"
	@printf "\n"

	@printf "%b\n" "This will remove:"
	@printf "%b\n" "  • Containers"
	@printf "%b\n" "  • Networks created by Compose"
	@printf "%b\n" "  • Volumes / DATABASE DATA"
	@printf "%b\n" "  • Project images"

	@printf "\n"
	@printf "%b" "Are you sure? Type 'yes' to continue: "; \
	read -r confirm; \
	if [ "$$confirm" != "yes" ]; then \
		printf "%b\n" "$(GREEN)Cancelled.$(RESET)"; \
		exit 0; \
	fi

	@printf "\n"
	@printf "%b\n" "$(RED)Removing containers, volumes and images...$(RESET)"
	@$(COMPOSE) down --volumes --remove-orphans --rmi all

	@printf "\n"
	@printf "%b\n" "$(GREEN)✔ Everything has been removed.$(RESET)"
	@printf "\n"


# ============================================================
# Phony targets
# ============================================================

.PHONY: up build open re restart stop \
        backend-stop backend-up alert status \
        logs logs-backend logs-frontend check \
        seed erase help
