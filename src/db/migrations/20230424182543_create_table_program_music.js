exports.up = function(knex) {
  return knex.schema
    .createTable('musics', function(table) {
      table.increments('id').primary();
      table.string('title', 255).notNullable();
      table.string('additional_info', 255);
    })
    .createTable('programs', function(table) {
      table.increments('id').primary();
      table.string('program_title', 255).notNullable();
      table.string('program_type', 255).notNullable();
      table.uuid('skater_id').references('id').inTable('skaters');
    })
    .createTable('program_music', function(table) {
      table.integer('program_id').references('programs.id').notNullable();
      table.integer('music_id').references('musics.id').notNullable();
      table.primary(['program_id', 'music_id']);
    })


};

exports.down = function(knex) {
  return knex.schema
    .dropTable('program_music')
    .dropTable('programs')
    .dropTable('musics')  
};
