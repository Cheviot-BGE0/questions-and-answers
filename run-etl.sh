#! /bin/bash

startTime=$(date +%s)
if [ ! -e "config.js" ]; then
  ./setup.sh
fi

while IFS="= ;'\"\`" read -ra line; do
  case ${line[0]} in
    module.exports.host)
      host=${line[2]}
      ;;
    module.exports.database)
      database=${line[2]}
      ;;
    module.exports.user)
      user=${line[2]}
      ;;
    module.exports.password)
      password=${line[2]}
      ;;
  esac
done < "config.js"

echo "SELECT 'CREATE DATABASE \"${database}\"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${database}')\gexec" | PGPASSWORD=$password psql -h $host -U $user template1

while read -e -p "Please enter path to folder conaining CSV data (questions.csv, answers.csv, answers_photos.csv): " CSV; do
  if [ -e "${CSV}/questions.csv" ] && [ -e "${CSV}/answers.csv" ] && [ -e "${CSV}/answers_photos.csv" ]; then
    break
  else
    echo 'Unable to find one or more of: questions.csv, answers.csv, answers_photos.csv. Please try a different folder!'
  fi
done

echo "Setup will now drop and create tables 'questions', 'answers', and 'answers-questions' and then begin loading data. THIS MAY TAKE SOME TIME."

read -p "Are you sure you want to proceed? " yn
if [[ ! $yn =~ ^[Yy]$ ]]; then
  exit 1
fi
startTime=$(date +%s)

PGPASSWORD=$password psql -h $host -U $user $database -f ETL/postgres/schemaQuestions.sql
PGPASSWORD=$password psql -h $host -U $user $database -f ETL/postgres/schemaAnswers.sql
PGPASSWORD=$password psql -h $host -U $user $database -f ETL/postgres/schemaAnswersPhotos.sql

node ETL/postgres -abort "${CSV}/questions.csv" questions
PGPASSWORD=$password psql -h $host -U $user $database -c "select setval('public.questions_id_seq', (select max(id) + 1 from questions))"
node ETL/postgres "${CSV}/answers.csv" answers
PGPASSWORD=$password psql -h $host -U $user $database -c "select setval('public.answers_id_seq', (select max(id) + 1 from answers))"
node ETL/postgres "${CSV}/answers_photos.csv" answers_photos

echo "Migrating photos into answers"

PGPASSWORD=$password psql -h $host -U $user $database -f ETL/postgres/populatePhotos.sql

diff=$(( $(date +%s) - $startTime ))

echo "ETL complete in ${diff} seconds! If there were any errors while loading, a CSV file for the corresponding database has been created containing the errored lines."
