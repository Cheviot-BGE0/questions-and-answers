if [ ! -e "config.js" ]; then
  echo ""
  echo "Creating config file, please provide the following:"
  read -p "address to Postgres host: " host
  read -p "Postgres user: " user
  read -p "Postgres password: " -s password
  echo ""
  read -p "Please name the database to be used: " database
  echo "module.exports.host = '${host}';" > config.js
  echo "module.exports.database = '${database}';" >> config.js
  echo "module.exports.user = '${user}';" >> config.js
  echo "module.exports.password = '${password}';" >> config.js
  echo "These choices can be changed any time by editing config.js (or deleting it and then re-running this script)"
fi
