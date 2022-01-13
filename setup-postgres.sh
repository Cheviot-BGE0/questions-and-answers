read -p "Please enter path to folder conaining CSV data: " CSV

read -p "Name of the Postgres database: " database

read -p "Postgres username: " username

read -p "Postgres password: " -s password

echo "Setup will now drop and create tables 'questions', 'answers', and 'answers-questions' and then begin loading data. THIS MAY TAKE SOME TIME."

read -p "Are you sure you want to proceed? " yn
if [[ ! $yn =~ ^[Yy]$ ]]
  then exit 1
fi

PGPASSWORD=$password psql -U $username $database -f ETL/postgres/schemaQuestions.sql
PGPASSWORD=$password psql -U $username $database -f ETL/postgres/schemaAnswers.sql
PGPASSWORD=$password psql -U $username $database -f ETL/postgres/schemaAnswersPhotos.sql

node ETL/postgres -U $username -p $password "${CSV}/questions.csv" $database questions
node ETL/postgres -U $username -p $password "${CSV}/answers.csv" $database answers
node ETL/postgres -U $username -p $password "${CSV}/answers_photos.csv" $database answers_photos

echo "ETL complete! If there were any errors while loading, a CSV file for the corresponding database has been created containing the errored block."
