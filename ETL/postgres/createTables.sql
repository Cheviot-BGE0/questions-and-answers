drop table if exists questions cascade;
drop table if exists answers cascade;
drop table if exists question_photos;

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

create table answers(
  id int generated by default as identity,
  question_id int,
  body varchar(1000),
  date date,
  answerer_name varchar(60),
  answerer_email varchar(60),
  helpfulness int,
  reported int,
  primary key(id),
  constraint fk_question
    foreign key(question_id)
      references questions(id)
      on delete cascade
);

create table question_photos(
  id int generated by default as identity,
  answer_id int,
  url varchar(200),
  primary key(id),
  constraint fk_answer
    foreign key(answer_id)
      references answers(id)
      on delete cascade
);

-- psql -U postgres questionsAndAnswers -f ETL/postgres/createTables.sql
