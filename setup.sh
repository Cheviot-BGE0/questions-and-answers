#! /bin/bash
echo ""
echo "Creating config file, please provide the following:"
read -p "address to Postgres host: " host
read -p "Postgres user: " user
read -p "Postgres password: " -s password
echo ""
read -p "Database to connect to: " database
echo "HOST=${host}" > private.env
echo "DATABASE=${database}" >> private.env
echo "USER=${user}" >> private.env
echo "PASSWORD=${password}" >> private.env
echo "These choices can be changed any time by re-running this script (or editing private.env)"
