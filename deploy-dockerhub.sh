#!/bin/bash

# ============================================
# YAPPMA Reload - Docker Hub Deployment Script
# ============================================
# Usage: ./deploy-dockerhub.sh [version]
# Example: ./deploy-dockerhub.sh 1.0.0

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKERHUB_USER="solaar45"
BACKEND_IMAGE="yappma-backend"
FRONTEND_IMAGE="yappma-frontend"
VERSION="${1:-latest}"

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose not found. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Docker login
    if ! docker info &> /dev/null; then
        print_error "Docker daemon not running or not accessible."
        exit 1
    fi
    
    print_info "Prerequisites OK"
}

check_docker_login() {
    print_info "Checking Docker Hub login..."
    
    if ! docker info | grep -q "Username: ${DOCKERHUB_USER}"; then
        print_warning "Not logged in to Docker Hub. Please login:"
        docker login
    else
        print_info "Already logged in as ${DOCKERHUB_USER}"
    fi
}

build_images() {
    print_info "Building images..."
    
    # Build with docker-compose
    if ! docker-compose build; then
        print_error "Failed to build images"
        exit 1
    fi
    
    print_info "Build complete"
}

tag_images() {
    print_info "Tagging images..."
    
    # Tag backend
    docker tag ${BACKEND_IMAGE}:latest ${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest
    docker tag ${BACKEND_IMAGE}:latest ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${VERSION}
    
    # Tag frontend
    docker tag ${FRONTEND_IMAGE}:latest ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest
    docker tag ${FRONTEND_IMAGE}:latest ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${VERSION}
    
    print_info "Tagging complete"
}

push_images() {
    print_info "Pushing images to Docker Hub..."
    
    # Push backend
    print_info "Pushing ${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest"
    docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:latest
    
    print_info "Pushing ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${VERSION}"
    docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${VERSION}
    
    # Push frontend
    print_info "Pushing ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest"
    docker push ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:latest
    
    print_info "Pushing ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${VERSION}"
    docker push ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${VERSION}
    
    print_info "Push complete"
}

print_summary() {
    echo ""
    echo "============================================"
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo "============================================"
    echo ""
    echo "Images pushed to Docker Hub:"
    echo "  Backend:  ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${VERSION}"
    echo "  Frontend: ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${VERSION}"
    echo ""
    echo "Pull with:"
    echo "  docker pull ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${VERSION}"
    echo "  docker pull ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${VERSION}"
    echo ""
    echo "Deploy with:"
    echo "  docker-compose up -d"
    echo ""
}

# Main execution
main() {
    echo "============================================"
    echo "YAPPMA Reload - Docker Hub Deployment"
    echo "============================================"
    echo ""
    echo "Version: ${VERSION}"
    echo "Docker Hub User: ${DOCKERHUB_USER}"
    echo ""
    
    check_prerequisites
    check_docker_login
    
    read -p "Build and push images? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    build_images
    tag_images
    push_images
    print_summary
}

# Run main function
main
