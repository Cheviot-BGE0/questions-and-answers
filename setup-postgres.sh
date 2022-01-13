echo "Please enter path to folder conaining CSV data: "
read CSV

echo "Name of the Postgres database: "
read database

echo "Postgres username: "
read username

echo "Postgres password: "
read -s password

node ETL/postgres -U $username -p $password "${CSV}/questions.csv" $database questions
node ETL/postgres -U $username -p $password "${CSV}/answers.csv" $database answers
node ETL/postgres -U $username -p $password "${CSV}/answers_photos.csv" $database answers_photos
