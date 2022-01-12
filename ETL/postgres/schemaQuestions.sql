drop table if exists questions cascade;

create table questions(
  id int generated by default as identity,
  product_id int,
  date_written date,
  body varchar(1000),
  asker_name varchar(60),
  asker_email varchar(60),
  helpful int,
  reported int,
  primary key(id)
);
-- psql -U postgres questionsAndAnswers -f ETL/postgres/schemaQuestions.sql
