#!/bin/bash

# Configuration
URL="http://localhost:3000/api/webhooks/razorpay"
NAME="Nagesh"
PHONE="+918762228856"
EMAIL="nagesh@example.com"
# Use a real Telegram Chat ID from your DB if you want a real invite link, 
# otherwise it will use a fallback or show an error in logs.
TELEGRAM_ID="-1001234567890" 

echo "🚀 Simulating Razorpay payment for $NAME ($PHONE)..."

curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"order.paid\",
    \"payload\": {
      \"payment\": {
        \"entity\": {
          \"id\": \"pay_TEST_$(date +%s)\",
          \"amount\": 100000,
          \"currency\": \"INR\",
          \"status\": \"captured\",
          \"method\": \"upi\",
          \"email\": \"$EMAIL\",
          \"contact\": \"$PHONE\",
          \"notes\": {
            \"name\": \"$NAME\",
            \"email\": \"$EMAIL\",
            \"phone\": \"$PHONE\",
            \"telegram_chat_id\": \"$TELEGRAM_ID\"
          }
        }
      }
    }
  }"

echo -e "\n\n✅ Done! Check your local terminal (where npm run dev is running) and your phone."
