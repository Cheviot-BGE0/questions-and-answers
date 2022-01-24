# questions-and-answers
## Deploying
- Spin up AWS EC2 instance
- ensure the security groups allow global http access, and ssh access from your address
- in repo dir on local machine, `sftp -i <path/to/aws/key> ubuntu@<AWS.endpoint.address>`
- `put start.sh`
- ssh into EC2: `ssh -i<path/to/aws/key> ubuntu@<AWS.endpoint.address>`
- `chmod +x start.sh && sudo ./start.sh`
- Fill out the db host address, username, password, and db name; accept the install as it goes
- assuming no errors, it should be running!