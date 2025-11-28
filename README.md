sui move new greetings

sui move build

sui client publish --gas-budget 100000000

sui client call  --package <PACKAGE_ID>  --module greeting  --function new  --gas-budget 10000000

sui client call  --package <PACKAGE_ID>  --module greeting --function update_text --args <GREETING_OBJECT_ID> "Hello Sui!" --gas-budget 10000000
