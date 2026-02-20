#!/bin/bash
# Setup script for AI Preacher Assistant ML components

echo "🔧 Setting up Python environment..."

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt



# Generate training data
echo "🎲 Generating training data..."
if [ -f "data/generate.py" ]; then
    python data/generate.py
elif [ -f "ml/data/generate.py" ]; then
    python ml/data/generate.py
else
    echo "⚠️ Could not find data/generate.py"
fi

echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  cd .."
echo "  npm run dev"
echo ""
echo "To train the ML model (optional):"
echo "  python train.py"
