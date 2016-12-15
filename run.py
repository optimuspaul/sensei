from app import main
import os

port = int(os.environ.get("PORT", 5000))
main.app.run(host='0.0.0.0', port=port)
