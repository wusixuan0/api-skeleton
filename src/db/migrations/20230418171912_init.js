const { v4: uuidv4 } = require('uuid');

exports.up = async function(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  return knex.schema
    .createTable('persons', function(table) {
      table.increments('id').primary();
      table.string('first_name').notNullable();
      table.string('family_name').notNullable();
      table.string('country');
      table.string('native_name', 100).collate('utf8mb4_unicode_ci');

      table.string('link');
      table.timestamps(true, true);
    })
    .createTable('skaters', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.integer('person_id').references('persons.id').notNullable();
      table.string('discipline').notNullable();
      table.string('program_link');
    })
    .createTable('choreographers', function(table) {
      table.increments('id').primary();
      table.integer('person_id').references('persons.id').notNullable();
    })
    .createTable('artists', function(table) {
      table.increments('id').primary();
      table.integer('person_id').references('persons.id').notNullable();
    })
    
};
exports.down = function (knex) {

  return knex.schema
    .dropTable('artists')
    .dropTable('choreographers')
    .dropTable('skaters')
    .dropTable('persons');
};
