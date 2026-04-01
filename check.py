from pymongo.mongo_client import MongoClient
from urllib.parse import quote_plus
import sys

# STEP 1: Put your ACTUAL Atlas Database User password here inside the quote_plus!
password = quote_plus("1") 
uri = f"mongodb+srv://mindcheck:{password}@cluster0.p8dqj5r.mongodb.net/mindcheck?retryWrites=true&w=majority&appName=Cluster0"

# STEP 2: Connecting with a 5-second timeout
client = MongoClient(uri, serverSelectionTimeoutMS=5000)

print(f"🔍 Testing connection to Cluster0...")
try:
    client.admin.command('ping')
    print("✅ SUCCESS: Connected to MongoDB!")
except Exception as e:
    print(f"❌ FAILURE: Connection failed: {e}")
    sys.exit(1)