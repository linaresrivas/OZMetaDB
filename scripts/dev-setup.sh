#!/bin/bash
# OZMetaDB Development Setup Script
# Fixes common Homebrew permission issues and installs dependencies

set -e

echo "🔧 OZMetaDB Development Setup"
echo "=============================="

# Check if running as root (shouldn't be)
if [ "$EUID" -eq 0 ]; then
  echo "❌ Don't run this script as root/sudo"
  exit 1
fi

# Fix common Homebrew permission issues
fix_homebrew_permissions() {
  echo "📁 Fixing Homebrew permissions..."

  DIRS=(
    "/usr/local/Cellar"
    "/usr/local/lib/cmake"
    "/usr/local/var/homebrew"
    "/usr/local/etc"
    "/usr/local/share"
    "/usr/local/lib"
    "/usr/local/include"
  )

  for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
      sudo chown -R $(whoami) "$dir" 2>/dev/null || true
    fi
  done

  echo "✅ Permissions fixed"
}

# Install Homebrew if not present
install_homebrew() {
  if ! command -v brew &> /dev/null; then
    echo "🍺 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  else
    echo "✅ Homebrew already installed"
  fi
}

# Install Node.js
install_node() {
  if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    brew install node
  else
    echo "✅ Node.js already installed ($(node --version))"
  fi
}

# Install Python dependencies
install_python_deps() {
  echo "🐍 Installing Python dependencies..."

  if [ -d "api" ]; then
    cd api
    python3 -m pip install -e . --quiet
    cd ..
    echo "✅ API dependencies installed"
  fi

  if [ -f "requirements.txt" ]; then
    python3 -m pip install -r requirements.txt --quiet
  fi
}

# Install UI dependencies
install_ui_deps() {
  echo "⚛️  Installing UI dependencies..."

  if [ -d "ui/ozmetadb-console" ]; then
    cd ui/ozmetadb-console
    npm install --silent
    cd ../..
    echo "✅ UI dependencies installed"
  fi
}

# Main
main() {
  # Navigate to project root
  SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
  cd "$SCRIPT_DIR/.."

  echo ""
  fix_homebrew_permissions
  echo ""
  install_homebrew
  echo ""
  install_node
  echo ""
  install_python_deps
  echo ""
  install_ui_deps
  echo ""

  echo "=============================="
  echo "✅ Setup complete!"
  echo ""
  echo "To start development servers:"
  echo ""
  echo "  # Terminal 1 - API"
  echo "  cd api && python3 -m uvicorn ozmetadb_api.main:app --reload --port 8080"
  echo ""
  echo "  # Terminal 2 - UI"
  echo "  cd ui/ozmetadb-console && npm run dev"
  echo ""
  echo "  API:  http://localhost:8080"
  echo "  UI:   http://localhost:3000"
  echo ""
}

main "$@"
