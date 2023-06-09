const data = require('./json/yunakim.json');
function parseName(name) {
  const nameParts = name.split(" ");
  const first_name = nameParts[0];
  const family_name = nameParts.slice(1).join(" ");
  return { first_name, family_name };
}

async function getPersonId(knex, name) {
  const result = await knex('persons')
    .select('id')
    .where({
      'full_name': name,
    })
    .first();
  return result ? result.id : null;
}

async function getChoreoId(knex, name) {
  const result = await knex('choreographers')
    .join('persons', 'persons.id', '=', 'choreographers.person_id')
    .where({
      'persons.full_name': name,
    })
    .select('choreographers.id')
    .first();
  return result ? result.id : null;
}

async function getArtistId(knex, name) {
  const result = await knex('artists')
    .join('persons', 'persons.id', '=', 'artists.person_id')
    .where({
      'persons.full_name': name,
    })
    .select('artists.id')
    .first();
  return result ? result.id : null;
}

async function getMusicId(knex, music_title) {
  const result = await knex('musics')
    .select('id')
    .where({
      'title': music_title,
    })
    .first();
  return result ? result.id : null;
}

exports.seed = async function(knex) {
  await knex('program_seasons').del()
  await knex('artist_music').del()
  await knex('program_choreographer').del()
  await knex('program_skater').del()
  await knex('program_music').del()
  await knex('musics').del()
  await knex('programs').del()
  await knex('seasons').del()
  
  await knex('choreographers').del();
  await knex('artists').del();
  await knex('skaters').del();
  await knex('persons').del();
 
  // seed seasons table from 1989 to 2024
  const seasons = [];
  for (let i = 0; i < 35; i++) {
    const year = 2023 - i;
    const seasonYear = `${year}–${year + 1}`;
    const season = { season_year: seasonYear };
    seasons.push(season);
  }
  await knex('seasons').insert(seasons);

  // manually seed person and skater row
  const person = {
    full_name: 'Yuna Kim',
    first_name: 'Yuna', 
    family_name: 'Kim',
    country: 'South Korea',
    native_name: '김연아',
    link: 'https://en.wikipedia.org/wiki/Yuna_Kim',
  };

  const [{ id: person_id }] = await knex('persons').insert(person).returning('id');

  const skater = {
    person_id: person_id,
    discipline: 'women',
    program_link: 'https://en.wikipedia.org/wiki/Yuna_Kim#Programs',
  }

  const [{ id: skater_id }] = await knex('skaters').insert(skater).returning('id');
  console.log(`Created ${ person.first_name} ${ person.family_name} with person id ${person_id } and skater id ${skater_id }` ); 

  for (const program of data) {

    const program_record = {
      program_title: program.program_title,
      program_type: program.program_type,
      skater_id: skater_id
    }
    const [{ id: program_id }] = await knex('programs').insert(program_record).returning('id');
    console.log(`Created ${ program.program_title } with id ${program_id } and skater id ${skater_id }` ); 
    
    await knex('program_skater').insert([
      {
        program_id: program_id, 
        skater_id: skater_id
      },
    ]);


    for (const musics of program['musics']) {

      
      let music_id = await getMusicId(knex, musics.title);

      if (!music_id) {
        const music = {
          title: musics.title,
          additional_info: musics.additional_info
        }
        const [{ id: new_music_id }] = await knex('musics').insert(music).returning('id');
        music_id = new_music_id
        console.log(`Created ${ musics.title } with music id ${music_id }` );
        if (musics.artists) {
          for (const role in musics.artists) {
            name_list = musics.artists[role].split(", ");
            for (const name of name_list) {
              const { first_name, family_name } = parseName(name)

              let person_id = await getPersonId(knex, name);
              let artist_id = await getArtistId(knex, name);

              if (!person_id) {
                const [{ id: artist_person_id }] = await knex('persons').insert({ full_name: name, first_name: first_name, family_name: family_name}).returning('id');
                person_id = artist_person_id
                console.log(`Created ${ name } with person id ${ artist_person_id }` ); 
              }

              if (!artist_id) {
                const [{ id: artist_new_id }] = await knex('artists').insert({ person_id: person_id}).returning('id');

                artist_id = artist_new_id
                console.log(`Created ${role} ${ first_name } ${ family_name } with person id ${ person_id }, artist id ${artist_new_id }` );  
              }
             
              await knex('artist_music').insert([
                {
                  artist_id: artist_id,
                  music_id: music_id,
                  role: role
                },
              ]);
            }
          }
        }
      }
      
      
      await knex('program_music').insert([
        {
          program_id: program_id,
          music_id: music_id,
        },
      ]);
    }

    // TODO 2: 
    // ignore repeated title for now
    // challenge: music with same title but different, need to check artist too to confirm
    // if title and artist are the same -> get music_id get skip musics.artists to choreo
    // if title is the same, but not artist -> create new music
    // if title is diff -> create new music
    // challenge 2: multiple artists with different role from music




  

    if (program.choreo) {
      name_list = program.choreo.split(", ");
      for (const choreo of name_list) {
        const [first_name, family_name] = choreo.split(" ");

        let person_id = await getPersonId(knex, choreo);
        let choreographer_id = await getChoreoId(knex, choreo);
        if (!person_id) {
          const [{ id: choreo_person_id }] = await knex('persons').insert({ full_name: choreo, first_name: first_name, family_name: family_name}).returning('id');
          person_id = choreo_person_id
          console.log(`Created ${ choreo } with person id ${choreo_person_id }` ); 
        } 

        if (!choreographer_id) {
          const [{ id: choreo_id }] = await knex('choreographers').insert({ person_id: person_id}).returning('id');
          console.log(`Created ${ choreo } from person id ${ person_id } and choreo id ${choreo_id }`);
          choreographer_id = choreo_id
        }
        
        await knex('program_choreographer').insert([
          {
            program_id: program_id,
            choreographer_id: choreographer_id,            
          },
        ]);
      }
    }



    for (const season of program.season) {
      const [{ id: season_id }] = await knex('seasons')
        .select('id')
        .where('season_year', season)

      await knex('program_seasons').insert([
        {
          program_id: program_id,
          season_id: season_id,
        },
      ]);  
    }

  }
}

  



