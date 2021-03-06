drop table if exists answers_photos;

create table answers_photos(
  id int generated by default as identity,
  answer_id int,
  url varchar(200),
  primary key(id),
  constraint fk_answer
    foreign key(answer_id)
      references answers(id)
      on delete cascade
);

create index answers_photos_answer_id_index on answers_photos (answer_id);
-- psql -U postgres questionsAndAnswers -f ETL/postgres/schemaAnswersPhotos.sql
