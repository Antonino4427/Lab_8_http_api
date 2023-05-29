'use strict'


const dayjs=require('dayjs');
const sqlite=require('sqlite3');


const db=new sqlite.Database('films.db', (err)=>{
    if(err) throw err;
});

const filters = {
    'filter-favorite':  { label: 'Favorites', url: '/filter/filter-favorite', filterFunction: film => film.favorite},
    'filter-best':      { label: 'Best Rated', url: '/filter/filter-best', filterFunction: film => film.rating >= 5},
    'filter-lastmonth': { label: 'Seen Last Month', url: '/filter/filter-lastmonth', filterFunction: film => isSeenLastMonth(film)},
    'filter-unseen':    { label: 'Unseen', url: '/filter/filter-unseen', filterFunction: film => film.watchDate.isValid() ? false : true}
  };

function listFilms(filter) {
    return new Promise((res,rej)=>{
        const sql='SELECT * FROM films';
        db.all(sql, (err,rows)=>{
            if(err) rej(err);
            
            

            const films = rows.map((e) => {
                // WARN: the database returns only lowercase fields. So, to be compliant with the client-side, we convert "watchdate" to the camelCase version ("watchDate").
                const film = Object.assign({}, e, { watchDate: dayjs(e.watchdate) });  // adding camelcase "watchDate"
                delete film.watchdate;  // removing lowercase "watchdate"
                return film;
            });
            if(filters.hasOwnProperty(filter)) {
                res(films.filter(filters[filter].filterFunction));
            }
            else {
                res(films);
            }
            
        })
    })
}

exports.FilmbyID=(id)=> {
    return new Promise((res,rej)=>{
        const sql='SELECT * FROM films WHERE id= ?';
        db.get(sql,[id], (err,row)=>{
            if (err) {
                rej(err);
              }
              if (row == undefined) {
                res({ error: 'Film not found.' });
              } else {
                // WARN: database is case insensitive. Converting "watchDate" to camel case format
                const film = Object.assign({}, row, { watchDate: row.watchdate } );  // adding camelcase "watchDate"
                delete film.watchdate;  // removing lowercase "watchdate"
                res(film);
              }
        })
    })
}

function createFilm(film) {
    return new Promise((res,rej)=>{
        const sql='INSERT INTO films (title, favorite, watchDate, rating) VALUES(?, ?, ?, ?)'
        db.run(sql, [film.title, film.favorite, film.watchDate, film.rating], (err)=>{
            if(err) throw err;
        
            res(null);
        })
    
    
    })
}

exports.updateFilm = (id, film) => {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE films SET title = ?, favorite = ?, watchDate = ?, rating = ? WHERE id = ?';
      db.run(sql, [film.title, film.favorite, film.watchDate, film.rating, id], function (err) {
        if (err) {
          reject(err);
        }
        if (this.changes !== 1) {
          resolve({ error: 'Film not found.'});
        } else {
          resolve(exports.FilmbyID(id)); 
        }
      });
    });
};

function DeleteFilm(id) {
    return new Promise((res,rej)=>{
        const sql='DELETE FROM films WHERE id = ?'
        db.run(sql, [id], (err)=>{
            if(err) throw err;
            res(id);
        })
    
    
    })
}


exports.listFilms=listFilms;
//exports.FilmbyID=FilmbyID;
exports.createFilm=createFilm;
exports.DeleteFilm=DeleteFilm;
//exports.updateFilm=updateFilm;

