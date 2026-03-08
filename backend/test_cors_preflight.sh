curl -v -X OPTIONS http://localhost:8080/api/track \
  -H "Origin: https://tracker.nesohq.org" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
