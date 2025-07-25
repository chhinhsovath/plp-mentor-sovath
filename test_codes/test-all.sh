#!/bin/bash

# Comprehensive Test Suite Runner for Nationwide Mentoring Platform
# This script runs all types of tests: unit, integration, e2e, accessibility, performance, and security

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
BACKEND_UNIT_RESULT=0
BACKEND_INTEGRATION_RESULT=0
FRONTEND_UNIT_RESULT=0
ACCESSIBILITY_RESULT=0
PERFORMANCE_RESULT=0
SECURITY_RESULT=0
E2E_RESULT=0

echo -e "${BLUE}🧪 Starting Comprehensive Test Suite for Nationwide Mentoring Platform${NC}"
echo "=================================================================="

# Function to print test section header
print_section() {
    echo -e "\n${BLUE}$1${NC}"
    echo "----------------------------------------"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if Docker is running (for database tests)
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker for database tests."
        exit 1
    fi
}

# Start test database
start_test_db() {
    print_section "Starting Test Database"
    
    # Stop existing test containers
    docker-compose -f docker-compose.test.yml down > /dev/null 2>&1 || true
    
    # Start test database
    docker-compose -f docker-compose.test.yml up -d postgres-test
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 10
    
    # Test database connection
    if docker-compose -f docker-compose.test.yml exec -T postgres-test pg_isready -U postgres > /dev/null 2>&1; then
        print_success "Test database is ready"
    else
        print_error "Failed to start test database"
        exit 1
    fi
}

# Stop test database
stop_test_db() {
    print_section "Stopping Test Database"
    docker-compose -f docker-compose.test.yml down > /dev/null 2>&1 || true
    print_success "Test database stopped"
}

# Backend Unit Tests
run_backend_unit_tests() {
    print_section "Running Backend Unit Tests"
    
    cd backend
    
    if npm run test:cov; then
        print_success "Backend unit tests passed"
        BACKEND_UNIT_RESULT=0
    else
        print_error "Backend unit tests failed"
        BACKEND_UNIT_RESULT=1
    fi
    
    cd ..
}

# Backend Integration Tests
run_backend_integration_tests() {
    print_section "Running Backend Integration Tests"
    
    cd backend
    
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USERNAME=postgres
    export DB_PASSWORD=postgres
    export DB_NAME=mentoring_test
    export JWT_SECRET=test-jwt-secret
    export NODE_ENV=test
    
    if npm run test:e2e; then
        print_success "Backend integration tests passed"
        BACKEND_INTEGRATION_RESULT=0
    else
        print_error "Backend integration tests failed"
        BACKEND_INTEGRATION_RESULT=1
    fi
    
    cd ..
}

# Frontend Unit Tests
run_frontend_unit_tests() {
    print_section "Running Frontend Unit Tests"
    
    cd frontend
    
    if npm run test:coverage; then
        print_success "Frontend unit tests passed"
        FRONTEND_UNIT_RESULT=0
    else
        print_error "Frontend unit tests failed"
        FRONTEND_UNIT_RESULT=1
    fi
    
    cd ..
}

# Accessibility Tests
run_accessibility_tests() {
    print_section "Running Accessibility Tests"
    
    cd frontend
    
    if npm run test -- --run --testPathPattern=accessibility; then
        print_success "Accessibility tests passed"
        ACCESSIBILITY_RESULT=0
    else
        print_error "Accessibility tests failed"
        ACCESSIBILITY_RESULT=1
    fi
    
    cd ..
}

# Performance Tests
run_performance_tests() {
    print_section "Running Performance Tests"
    
    cd backend
    
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USERNAME=postgres
    export DB_PASSWORD=postgres
    export DB_NAME=mentoring_performance_test
    export JWT_SECRET=test-jwt-secret
    export NODE_ENV=test
    
    if npm run test:e2e -- --testPathPattern=performance --maxWorkers=1; then
        print_success "Performance tests passed"
        PERFORMANCE_RESULT=0
    else
        print_error "Performance tests failed"
        PERFORMANCE_RESULT=1
    fi
    
    cd ..
}

# Security Tests
run_security_tests() {
    print_section "Running Security Tests"
    
    cd backend
    
    # Run npm audit
    echo "Running npm security audit..."
    if npm audit --audit-level=moderate; then
        print_success "npm audit passed"
    else
        print_warning "npm audit found vulnerabilities"
    fi
    
    # Run security-specific tests
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USERNAME=postgres
    export DB_PASSWORD=postgres
    export DB_NAME=mentoring_test
    export JWT_SECRET=test-jwt-secret
    export NODE_ENV=test
    
    if npm run test:e2e -- --testPathPattern=security; then
        print_success "Security tests passed"
        SECURITY_RESULT=0
    else
        print_error "Security tests failed"
        SECURITY_RESULT=1
    fi
    
    cd ..
}

# End-to-End Tests
run_e2e_tests() {
    print_section "Running End-to-End Tests"
    
    # Build frontend first
    cd frontend
    npm run build
    cd ..
    
    # Start backend in background
    cd backend
    npm run build
    
    export DB_HOST=localhost
    export DB_PORT=5432
    export DB_USERNAME=postgres
    export DB_PASSWORD=postgres
    export DB_NAME=mentoring_e2e_test
    export JWT_SECRET=test-jwt-secret
    export NODE_ENV=production
    export PORT=3000
    
    # Start backend server in background
    npm run start:prod &
    BACKEND_PID=$!
    
    # Wait for server to start
    sleep 15
    
    # Run E2E tests
    export NODE_ENV=test
    if npm run test:e2e -- --testPathPattern=complete-observation-workflow; then
        print_success "End-to-end tests passed"
        E2E_RESULT=0
    else
        print_error "End-to-end tests failed"
        E2E_RESULT=1
    fi
    
    # Stop backend server
    kill $BACKEND_PID > /dev/null 2>&1 || true
    
    cd ..
}

# Generate test report
generate_test_report() {
    print_section "Test Results Summary"
    
    echo "Backend Unit Tests:       $([ $BACKEND_UNIT_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo "Backend Integration Tests: $([ $BACKEND_INTEGRATION_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo "Frontend Unit Tests:      $([ $FRONTEND_UNIT_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo "Accessibility Tests:      $([ $ACCESSIBILITY_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo "Performance Tests:        $([ $PERFORMANCE_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo "Security Tests:           $([ $SECURITY_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    echo "End-to-End Tests:         $([ $E2E_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
    
    TOTAL_FAILURES=$((BACKEND_UNIT_RESULT + BACKEND_INTEGRATION_RESULT + FRONTEND_UNIT_RESULT + ACCESSIBILITY_RESULT + PERFORMANCE_RESULT + SECURITY_RESULT + E2E_RESULT))
    
    echo ""
    if [ $TOTAL_FAILURES -eq 0 ]; then
        print_success "All tests passed! 🎉"
        echo ""
        echo "Coverage reports are available in:"
        echo "  - Backend: backend/coverage/"
        echo "  - Frontend: frontend/coverage/"
    else
        print_error "$TOTAL_FAILURES test suite(s) failed"
        echo ""
        echo "Please check the logs above for details on failed tests."
        exit 1
    fi
}

# Cleanup function
cleanup() {
    echo ""
    print_section "Cleaning Up"
    
    # Stop any background processes
    jobs -p | xargs -r kill > /dev/null 2>&1 || true
    
    # Stop test database
    stop_test_db
    
    print_success "Cleanup completed"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    # Parse command line arguments
    RUN_ALL=true
    SKIP_DB=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --unit-only)
                RUN_ALL=false
                RUN_UNIT=true
                shift
                ;;
            --integration-only)
                RUN_ALL=false
                RUN_INTEGRATION=true
                shift
                ;;
            --e2e-only)
                RUN_ALL=false
                RUN_E2E=true
                shift
                ;;
            --skip-db)
                SKIP_DB=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --unit-only       Run only unit tests"
                echo "  --integration-only Run only integration tests"
                echo "  --e2e-only        Run only end-to-end tests"
                echo "  --skip-db         Skip database-dependent tests"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    if [ "$SKIP_DB" = false ]; then
        check_docker
        start_test_db
    fi
    
    # Install dependencies
    print_section "Installing Dependencies"
    
    cd backend && npm ci && cd ..
    cd frontend && npm ci && cd ..
    
    print_success "Dependencies installed"
    
    # Run tests based on options
    if [ "$RUN_ALL" = true ]; then
        run_frontend_unit_tests
        
        if [ "$SKIP_DB" = false ]; then
            run_backend_unit_tests
            run_backend_integration_tests
            run_performance_tests
            run_security_tests
            run_e2e_tests
        fi
        
        run_accessibility_tests
    else
        if [ "$RUN_UNIT" = true ]; then
            run_frontend_unit_tests
            if [ "$SKIP_DB" = false ]; then
                run_backend_unit_tests
            fi
        fi
        
        if [ "$RUN_INTEGRATION" = true ] && [ "$SKIP_DB" = false ]; then
            run_backend_integration_tests
        fi
        
        if [ "$RUN_E2E" = true ] && [ "$SKIP_DB" = false ]; then
            run_e2e_tests
        fi
    fi
    
    # Generate final report
    generate_test_report
}

# Run main function
main "$@"