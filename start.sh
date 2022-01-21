#! /bin/bash
if [ ! -e ".env" ]; then
  echo ""
  echo "Creating config file, please provide the following:"
  read -p "address to Postgres host: " host
  read -p "Postgres user: " user
  read -p "Postgres password: " -s password
  echo ""
  read -p "Database to connect to: " database
  echo "HOST=${host}" > .env
  echo "DATABASE=${database}" >> .env
  echo "USER=${user}" >> .env
  echo "PASSWORD=${password}" >> .env
  echo "These choices can be changed any time by re-running this script (or editing .env)"

  apt-get update
  apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update
  apt-get install docker-ce docker-ce-cli containerd.io
fi

docker pull liamrichardson/hackreactor:questions-and-answers-server
docker run -dp 80:3000 --env-file .env liamrichardson/hackreactor:questions-and-answers-server
